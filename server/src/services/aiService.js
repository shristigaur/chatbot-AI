import { env } from '../config/env.js';
import { toText } from '../utils/toText.js';
import { buildSystemPrompt } from './promptBuilder.js';
import { modelResolver } from './modelResolver.js';

const missingConfigMessage = 'AI service is not configured. Set AI_API_KEY (or HF_API_TOKEN), AI_API_URL (or HF_API_URL), and AI_MODEL (or HF_MODEL) in server/.env.';
let charactersFallbackLogged = false;

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
  if (!isHfConfigured()) {
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

  if (!isHfConfigured()) throw new FriendlyError(missingConfigMessage, 500);

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

// Chain of providers
async function requestProviderChain(body, ageFilter, onText = null) {
  const providers = [];
  if (env.huggingFaceUrl && env.huggingFaceToken && env.huggingFaceModel) {
    providers.push({
      id: 'primary',
      url: env.huggingFaceUrl,
      token: env.huggingFaceToken,
      model: env.huggingFaceModel
    });
    if (env.modelFallback) {
      providers.push({
        id: 'primary-fallback',
        url: env.huggingFaceUrl,
        token: env.huggingFaceToken,
        model: env.modelFallback
      });
    }
  }
  if (env.fallbackUrl && env.fallbackToken && env.fallbackModel) {
    providers.push({
      id: 'secondary',
      url: env.fallbackUrl,
      token: env.fallbackToken,
      model: env.fallbackModel
    });
  }

  if (providers.length === 0) {
    throw new FriendlyError(missingConfigMessage, 500);
  }

  let lastError;
  let hasEmittedTokens = false;

  const handleText = (t) => {
    hasEmittedTokens = true;
    if (onText) onText(t);
  };

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    if (!canTry(provider.id)) {
      console.warn(`Skipping provider ${provider.id} due to circuit breaker.`);
      continue;
    }

    try {
      const response = await executeWithRetries(provider, body, ageFilter, handleText, (attempt, err) => {
        if (!hasEmittedTokens && onText && attempt > 1) {
          // Sending thinking indicator on retry
          onText('<think>Thinking a bit longer...</think>');
          hasEmittedTokens = true;
        }
      });
      console.info(`Provider ${provider.id} succeeded.`);
      recordSuccess(provider.id);
      return response; // Return response or fullText
    } catch (error) {
      recordFailure(provider.id);
      lastError = error;
      
      if (hasEmittedTokens && body.stream) {
        // If stream failed halfway, we abort the chain and send cutoff text
        console.warn(`Stream failed halfway on ${provider.id}. Emitting cutoff.`);
        if (onText) {
           onText('\n\n[Network error. Reply was cut off. Say "Continue" to resume.]');
        }
        return ''; // Returning empty so caller knows it finished, the text is already streamed
      }

      console.warn(`Provider ${provider.id} failed: ${error.message}. Trying next provider...`);
    }
  }

  const isChildren = ageFilter === 'Children';
  const msg = isChildren ? "Lumina is taking a nap right now. Please ask a grown-up to help, or try again later!" : "The AI is busy right now, please try again in a moment";
  
  if (lastError && lastError.status) {
    const finalError = new FriendlyError(msg, lastError.status);
    finalError.retryAfter = lastError.retryAfter;
    throw finalError;
  }
  throw new FriendlyError(msg, 503);
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
  const model = await modelResolver.resolveModel(provider.url, provider.token, provider.model);
  
  const standardBody = {
    model: model,
    messages: body.messages,
  };
  if (body.max_tokens !== undefined) standardBody.max_tokens = body.max_tokens;
  if (body.temperature !== undefined) standardBody.temperature = body.temperature;
  if (body.stream !== undefined) standardBody.stream = body.stream;
  
  const isHfRouter = provider.url.includes('router.huggingface.co');
  if (isHfRouter) {
    standardBody.chat_template_kwargs = { enable_thinking: false };
  }

  const controller = new AbortController();
  const timeoutMs = body.stream ? 15000 : 25000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(provider.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${provider.token}`,
        'Content-Type': 'application/json',
        Accept: body.stream ? 'text/event-stream' : 'application/json',
      },
      body: JSON.stringify(standardBody),
      signal: controller.signal
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      const fe = new FriendlyError('timeout', 504);
      throw fe;
    }
    throw new FriendlyError(error.message, 500);
  }

  clearTimeout(timeoutId);

  if (!response.ok) {
    const rawBody = await response.text();
    const fe = new FriendlyError(rawBody.slice(0, 300), response.status);
    fe.retryAfter = response.headers.get('retry-after');
    throw fe;
  }

  if (body.stream) {
    let currentText = '';
    let thinkMode = false;
    
    // Extend timeout for remainder of stream to avoid dropping active streams
    const streamController = new AbortController();
    const streamTimeout = setTimeout(() => streamController.abort(), 60000);

    try {
      await readSse(response.body, (chunk) => {
        const token = chunk?.choices?.[0]?.delta?.content ?? '';
        if (token.includes('<think>')) thinkMode = true;
        if (thinkMode && token.includes('</think>')) {
          thinkMode = false;
          const parts = token.split('</think>');
          if (parts.length > 1 && parts[1]) {
             const textToken = toText(parts[1]);
             currentText += textToken;
             if (onText) onText(textToken);
          }
          return;
        }
        
        if (!thinkMode && token && !token.includes('<think>')) {
          const textToken = toText(token);
          currentText += textToken;
          if (onText) onText(textToken);
        }
      }, streamController.signal);
    } catch (e) {
      clearTimeout(streamTimeout);
      throw new FriendlyError('Stream dropped halfway', 500);
    }
    clearTimeout(streamTimeout);
    return currentText;
  }
  
  return await response.json();
}

async function readSse(stream, onData, signal) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  
  signal?.addEventListener('abort', () => {
    reader.cancel();
  });

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value || new Uint8Array(), { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';
      for (const event of events) {
        const line = event.split('\n').find((item) => item.startsWith('data:'));
        if (!line) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') continue;
        try {
          onData(JSON.parse(payload));
        } catch {
          // malformed payload
        }
      }
    }
  } catch (error) {
    throw new Error(`SSE read failed: ${error.message}`);
  } finally {
    reader.releaseLock();
  }
}

function isHfConfigured() {
  return Boolean(
    (env.huggingFaceToken && env.huggingFaceToken !== 'PASTE_YOUR_NEW_TOKEN_HERE' && env.huggingFaceUrl && env.huggingFaceModel) ||
    (env.fallbackToken && env.fallbackUrl && env.fallbackModel)
  );
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
  const statuses = [];
  
  if (env.huggingFaceUrl && env.huggingFaceModel) {
    statuses.push({
      name: 'primary',
      host: new URL(env.huggingFaceUrl).host,
      model: env.huggingFaceModel,
      state: canTry('primary') ? 'ok' : 'skipped'
    });
    if (env.modelFallback) {
      statuses.push({
        name: 'primary-fallback',
        host: new URL(env.huggingFaceUrl).host,
        model: env.modelFallback,
        state: canTry('primary-fallback') ? 'ok' : 'skipped'
      });
    }
  }
  if (env.fallbackUrl && env.fallbackModel) {
    statuses.push({
      name: 'secondary',
      host: new URL(env.fallbackUrl).host,
      model: env.fallbackModel,
      state: canTry('secondary') ? 'ok' : 'skipped'
    });
  }
  return statuses;
}
