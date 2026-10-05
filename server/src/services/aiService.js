import { env, isConfiguredKey } from '../config/env.js';
import OpenAI from 'openai';
import { toText } from '../utils/toText.js';
import { buildSystemPrompt } from './promptBuilder.js';

const missingConfigMessage = 'AI service is not configured. Set GROQ_API_KEY, GROQ_BASE_URL, and OPENAI_MODEL in server/.env.';
let charactersFallbackLogged = false;
let openaiClient;

// Concurrency queue
let activeAiCalls = 0;
const MAX_CONCURRENT_CALLS = 3;
const queue = [];

async function acquireToken() {
  if (activeAiCalls < MAX_CONCURRENT_CALLS) {
    activeAiCalls++;
    return;
  }
  return new Promise((resolve) => {
    queue.push(resolve);
  });
}

function releaseToken() {
  activeAiCalls--;
  if (queue.length > 0) {
    const resolve = queue.shift();
    activeAiCalls++;
    resolve();
  }
}

// Circuit breaker state
const breakerState = new Map();
function getBreaker(id) {
  if (!breakerState.has(id)) {
    breakerState.set(id, { failures: [], skipUntil: 0 });
  }
  return breakerState.get(id);
}
function recordFailure(id) {
  const state = getBreaker(id);
  const now = Date.now();
  state.failures.push(now);
  state.failures = state.failures.filter(t => now - t < 60000); // last 60s
  if (state.failures.length >= 3) {
    state.skipUntil = now + 120000; // 2 minutes
    state.failures = []; // reset for after skip
    console.warn(`Circuit breaker tripped for ${id}. Skipping for 2 minutes.`);
  }
}
function recordSuccess(id) {
  const state = getBreaker(id);
  state.failures = [];
  state.skipUntil = 0;
}
function canTry(id) {
  const state = getBreaker(id);
  return Date.now() > state.skipUntil;
}

class FriendlyError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.friendlyMessage = message;
  }
}

function getFriendlyMessage(status, isChildrenMode) {
  if (isChildrenMode) return "Lumina is taking a nap right now. Please ask a grown-up to help, or try again later!";
  if (status === 400) return 'The AI request was rejected (check the model name in settings).';
  if (status === 401) return 'AI key is invalid.';
  if (status === 402) return 'AI credits are finished. Please add credits or switch the AI provider.';
  if (status === 403) return 'Model access denied.';
  if (status === 404) return 'The AI model was not found.';
  if (status === 429) return 'Too many requests, please wait a moment.';
  if (status >= 500) return 'AI provider is having issues.';
  return 'An unexpected error occurred.';
}

const cache = new Map();
function getCacheKey(messages, ageFilter) {
  return ageFilter + ':' + messages.map(m => m.role + m.content).join('|');
}

export async function predictCharacters(messages, ageFilter) {
  if (!isOpenAiConfigured()) {
    logCharacterFallback(missingConfigMessage);
    return fallbackCharacters(ageFilter);
  }
  const key = getCacheKey(messages, ageFilter);
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  await acquireToken();
  try {
    const response = await requestProviderChain({
      max_tokens: 700,
      messages: [
        { role: 'system', content: 'Return only valid JSON with exactly three characters in a characters array. Each character needs name, emoji, personality, speakingStyle, suggestedTheme, and whyThisFits.' },
        { role: 'user', content: `Age filter: ${ageFilter}. Conversation:\n${messages.slice(-8).map((item) => `${item.role}: ${toText(item.content)}`).join('\n')}` },
      ],
      stream: false
    }, ageFilter);
    const chars = parseCharacters(extractText(response), ageFilter);
    cache.set(key, chars);
    setTimeout(() => cache.delete(key), 5 * 60 * 1000); // 5 min cache
    return chars;
  } catch (err) {
    logCharacterFallback(`predictCharacters error: ${err.message}`);
    return fallbackCharacters(ageFilter);
  } finally {
    releaseToken();
  }
}

export async function streamReply({ messages, ageFilter, character, onText }) {
  const context = [
    { role: 'system', content: buildSystemPrompt({ ageFilter, character }) },
    ...messages.slice(-8).map(({ role, content }) => ({ role, content: toText(content) })),
  ];

  if (!isOpenAiConfigured()) throw new FriendlyError(missingConfigMessage, 500);

  let currentMaxTokens = ageFilter === 'Children' ? 400 : 800;
  
  await acquireToken();
  try {
    const fullText = await requestProviderChain({ 
      messages: context, 
      stream: true, 
      max_tokens: currentMaxTokens 
    }, ageFilter, onText);
    
    if (!fullText.trim()) {
      throw new FriendlyError(getFriendlyMessage(500, ageFilter === 'Children'), 500);
    }
    return fullText;
  } catch (err) {
    // Top level catch if all providers fail
    throw err instanceof FriendlyError ? err : new FriendlyError(getFriendlyMessage(500, ageFilter === 'Children'), 500);
  } finally {
    releaseToken();
  }
}

function extractText(data) {
  return toText(data?.choices?.[0]?.message?.content);
}

async function requestProviderChain(body, ageFilter, onText = null) {
  if (!isOpenAiConfigured()) throw new FriendlyError(missingConfigMessage, 500);
  const provider = { id: 'openai', model: env.openaiModel };

  let lastError;
  let hasEmittedTokens = false;

  const handleText = (t) => {
    hasEmittedTokens = true;
    if (onText) onText(t);
  };

  if (!canTry(provider.id)) throw new FriendlyError('The OpenAI service is temporarily unavailable. Please try again shortly.', 503);

  try {
    const response = await executeWithRetries(provider, body, ageFilter, handleText, (attempt, err) => {
      if (!hasEmittedTokens && onText && attempt > 1) {
        onText('<think>Thinking a bit longer...</think>');
        hasEmittedTokens = true;
      }
    });
    recordSuccess(provider.id);
    return response;
  } catch (error) {
    recordFailure(provider.id);
    lastError = error;
    if (hasEmittedTokens && body.stream) {
      if (onText) onText('\n\n[Network error. Reply was cut off. Say "Continue" to resume.]');
      return '';
    }
  }

  const isChildren = ageFilter === 'Children';
  if (lastError && lastError.status) {
    const finalError = new FriendlyError(getFriendlyMessage(lastError.status, isChildren), lastError.status);
    finalError.retryAfter = lastError.retryAfter;
    throw finalError;
  }
  throw new FriendlyError(getFriendlyMessage(503, isChildren), 503);
}

const wait = ms => new Promise(r => setTimeout(r, ms));

async function executeWithRetries(provider, body, ageFilter, onText, onRetry) {
  let attempt = 1;
  const maxAttempts = 5;

  while (attempt <= maxAttempts) {
    try {
      return await makeCall(provider, body, ageFilter, onText);
    } catch (err) {
      const status = err.status || 500;
      const retryable = [429, 500, 502, 503, 504].includes(status) || err.message.includes('timeout') || err.message.includes('fetch');
      
      if (!retryable || attempt === maxAttempts) {
        throw err;
      }
      
      onRetry(attempt, err);
      console.warn(`Attempt ${attempt} failed on ${provider.id} with ${status}. Retrying...`);
      
      let delay = 1000 * (2 ** (attempt - 1));
      if (err.retryAfter) {
        const ra = parseInt(err.retryAfter, 10);
        if (!isNaN(ra) && ra > 0) {
          delay = Math.max(delay, ra * 1000);
        }
      }
      
      await wait(delay);
      attempt++;
    }
  }
}

async function makeCall(provider, body, ageFilter, onText) {
  const request = {
    model: provider.model,
    messages: body.messages,
    stream: Boolean(body.stream),
  };
  if (body.max_tokens !== undefined) request.max_tokens = body.max_tokens;
  if (body.temperature !== undefined) request.temperature = body.temperature;

  const controller = new AbortController();
  const timeoutMs = body.stream ? 60000 : 25000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await getOpenAiClient().chat.completions.create(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!body.stream) return response;

    let currentText = '';
    let thinkMode = false;
    for await (const chunk of response) {
      const token = chunk.choices?.[0]?.delta?.content ?? '';
      if (token.includes('<think>')) thinkMode = true;
      if (thinkMode && token.includes('</think>')) {
        thinkMode = false;
        const parts = token.split('</think>');
        if (parts[1]) {
          const textToken = toText(parts[1]);
          currentText += textToken;
          if (onText) onText(textToken);
        }
      } else if (!thinkMode && token && !token.includes('<think>')) {
        const textToken = toText(token);
        currentText += textToken;
        if (onText) onText(textToken);
      }
    }
    return currentText;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      const fe = new FriendlyError('timeout', 504);
      throw fe;
    }
    const isQuotaError = error.status === 429 && (
      error.code === 'insufficient_quota' ||
      error.code === 'billing_hard_limit_reached' ||
      /no credits|insufficient quota|billing/i.test(error.message || '')
    );
    const friendlyError = new FriendlyError(error.message, isQuotaError ? 402 : (error.status || 500));
    friendlyError.providerCode = error.code;
    friendlyError.retryAfter = error.headers?.get?.('retry-after') || error.headers?.['retry-after'];
    throw friendlyError;
  }
}

function getOpenAiClient() {
  if (!openaiClient || openaiClient.apiKey !== env.openaiApiKey) {
    openaiClient = new OpenAI({
      apiKey: env.openaiApiKey,
      baseURL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    });
  }
  return openaiClient;
}

function isOpenAiConfigured() {
  return Boolean(isConfiguredKey(env.openaiApiKey) && env.openaiModel);
}

function logCharacterFallback(reason) {
  if (!charactersFallbackLogged) {
    console.warn(`Using fallback characters: ${reason}`);
    charactersFallbackLogged = true;
  }
}

function parseCharacters(text, ageFilter) {
  try {
    const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ''));
    if (!Array.isArray(parsed.characters) || parsed.characters.length !== 3) throw new Error('Invalid character response');
    return parsed.characters.map((character) => ({
      name: toText(character.name).slice(0, 40),
      emoji: toText(character.emoji).slice(0, 4),
      personality: toText(character.personality).slice(0, 180),
      speakingStyle: toText(character.speakingStyle).slice(0, 180),
      suggestedTheme: toText(character.suggestedTheme).slice(0, 30),
      whyThisFits: toText(character.whyThisFits).slice(0, 180),
    }));
  } catch (error) {
    return fallbackCharacters(ageFilter);
  }
}

function fallbackCharacters(ageFilter) {
  const suffix = ageFilter === 'Children' ? 'Sunny' : 'Nova';
  return [
    { name: `${suffix} Guide`, emoji: '✦', personality: 'Curious and supportive', speakingStyle: 'Clear, upbeat, and concise', suggestedTheme: 'aurora', whyThisFits: 'A friendly default for exploring ideas.' },
    { name: 'Sage', emoji: '◒', personality: 'Patient and reflective', speakingStyle: 'Calm with thoughtful detail', suggestedTheme: 'linen', whyThisFits: 'Good for careful decisions and learning.' },
    { name: 'Spark', emoji: '✺', personality: 'Creative and energetic', speakingStyle: 'Playful with practical examples', suggestedTheme: 'citrus', whyThisFits: 'Useful when you want momentum and fresh ideas.' },
  ];
}

// Function to expose status for /api/health
export function getProviderStatus() {
  return [{
    name: 'groq',
    host: new URL(env.groqBaseUrl).host,
    model: env.openaiModel,
    state: canTry('openai') ? 'ok' : 'skipped'
  }];
}
