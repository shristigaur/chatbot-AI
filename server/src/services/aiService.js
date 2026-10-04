import { env } from '../config/env.js';
import { toText } from '../utils/toText.js';
import { buildSystemPrompt } from './promptBuilder.js';
import { modelResolver } from './modelResolver.js';

const missingConfigMessage = 'AI is not configured. Add AI_API_KEY to server/.env and restart the server.';
let charactersFallbackLogged = false;

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

export async function streamReply({ messages, ageFilter, character, onText }) {
  const context = [
    { role: 'system', content: buildSystemPrompt({ ageFilter, character }) },
    ...messages.slice(-12).map(({ role, content }) => ({ role, content: toText(content) })),
  ];

  if (!isHfConfigured()) throw new FriendlyError(missingConfigMessage, 500);

  let currentMaxTokens = ageFilter === 'Children' ? 600 : 1600;
  let fullText = '';
  
  for (let attempt = 1; attempt <= 2; attempt++) {
    const response = await requestHuggingFace({ messages: context, stream: true, max_tokens: currentMaxTokens }, ageFilter);
    if (!response.body) throw new FriendlyError('Hugging Face returned an empty response stream.', 500);

    let currentText = '';
    let thinkMode = false;
    await readSse(response.body, (chunk) => {
      const token = chunk?.choices?.[0]?.delta?.content ?? '';
      
      if (token.includes('<think>')) thinkMode = true;
      if (thinkMode && token.includes('</think>')) {
        thinkMode = false;
        // Optionally extract text after </think> if they are in the same token
        const parts = token.split('</think>');
        if (parts.length > 1 && parts[1]) {
           const textToken = toText(parts[1]);
           currentText += textToken;
           onText(textToken);
        }
        return;
      }
      
      if (!thinkMode && token && !token.includes('<think>')) {
        const textToken = toText(token);
        currentText += textToken;
        onText(textToken);
      }
    });
    
    // Check for empty reply
    if (!currentText.trim()) {
      if (attempt === 1) {
        console.warn('AI returned empty reply, retrying with higher max_tokens...');
        currentMaxTokens += 1000;
        continue;
      }
      throw new FriendlyError(getFriendlyMessage(500, ageFilter === 'Children'), 500);
    }
    
    fullText = currentText;
    break; // Success
  }
  
  return fullText;
}

export async function predictCharacters(messages, ageFilter) {
  if (!isHfConfigured()) {
    logCharacterFallback(missingConfigMessage);
    return fallbackCharacters(ageFilter);
  }
  try {
    const response = await requestHuggingFace({
      max_tokens: 700,
      messages: [
        { role: 'system', content: 'Return only valid JSON with exactly three characters in a characters array. Each character needs name, emoji, personality, speakingStyle, suggestedTheme, and whyThisFits.' },
        { role: 'user', content: `Age filter: ${ageFilter}. Conversation:\n${messages.slice(-8).map((item) => `${item.role}: ${toText(item.content)}`).join('\n')}` },
      ],
    }, ageFilter);
    return parseCharacters(extractText(response), ageFilter);
  } catch (err) {
    logCharacterFallback(`predictCharacters error: ${err.message}`);
    return fallbackCharacters(ageFilter);
  }
}

function extractText(data) {
  return toText(data?.choices?.[0]?.message?.content);
}

async function requestHuggingFace(body, ageFilter, useFallback = false, omitKwargs = false, forceModel = false) {
  let response;
  const token = useFallback ? env.fallbackToken : env.huggingFaceToken;
  const url = useFallback ? env.fallbackUrl : env.huggingFaceUrl;
  const configuredModel = useFallback ? env.fallbackModel : env.huggingFaceModel;
  
  if (!url || !token || !configuredModel) {
    if (useFallback) throw new FriendlyError(getFriendlyMessage(500, ageFilter === 'Children'), 500);
    throw new FriendlyError(missingConfigMessage, 500);
  }

  const model = await modelResolver.resolveModel(url, token, configuredModel, forceModel);

  const standardBody = {
    model: model,
    messages: body.messages,
  };
  if (body.max_tokens !== undefined) standardBody.max_tokens = body.max_tokens;
  if (body.temperature !== undefined) standardBody.temperature = body.temperature;
  if (body.stream !== undefined) standardBody.stream = body.stream;
  
  const isHfRouter = url.includes('router.huggingface.co');
  if (isHfRouter && !omitKwargs) {
    standardBody.chat_template_kwargs = { enable_thinking: false };
  }

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: body.stream ? 'text/event-stream' : 'application/json',
      },
      body: JSON.stringify(standardBody),
    });
  } catch (error) {
    if (!useFallback && env.fallbackUrl && env.fallbackToken && env.fallbackModel) {
       console.warn('Primary AI failed, retrying on fallback...');
       return requestHuggingFace(body, ageFilter, true);
    }
    throw new FriendlyError(getFriendlyMessage(500, ageFilter === 'Children'), 500);
  }

  if (!response.ok) {
    const rawBody = await response.text();
    console.error(`Unexpected AI response [${response.status}]:`, rawBody.slice(0, 300));
    
    // Self-healing for model missing
    if (response.status === 404 || rawBody.includes('model_not_found') || rawBody.includes('does not exist')) {
      if (!forceModel) {
        console.warn('Model not found or error, forcing model re-resolution...');
        return requestHuggingFace(body, ageFilter, useFallback, omitKwargs, true);
      }
    }
    
    const isKwargsError = rawBody.includes('chat_template_kwargs');
    if (response.status === 400 && isKwargsError && !omitKwargs) {
      console.warn('Provider rejected chat_template_kwargs, retrying without it...');
      return requestHuggingFace(body, ageFilter, useFallback, true, forceModel);
    }
    
    if (response.status === 400 && rawBody.toLowerCase().includes('model')) {
      console.log('Check AI_MODEL/HF_MODEL for this provider');
    }
    
    // If 402, 429, or 5xx, try fallback
    if ([402, 429].includes(response.status) || response.status >= 500) {
      if (!useFallback && env.fallbackUrl && env.fallbackToken && env.fallbackModel) {
        console.warn(`Primary AI returned ${response.status}, retrying on fallback...`);
        return requestHuggingFace(body, ageFilter, true);
      }
    }
    throw new FriendlyError(getFriendlyMessage(response.status, ageFilter === 'Children'), response.status);
  }
  return response;
}

async function readSse(stream, onData) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
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
          console.error('Unexpected Hugging Face SSE payload:', payload.slice(0, 500));
          throw new Error('Hugging Face returned malformed streaming data.');
        }
      }
      if (done) break;
    }
  } catch (error) {
    throw new Error(`Hugging Face stream failed: ${error.message}`);
  }
}

function isHfConfigured() {
  return Boolean(
    env.huggingFaceToken
      && env.huggingFaceToken !== 'PASTE_YOUR_NEW_TOKEN_HERE'
      && env.huggingFaceUrl
      && env.huggingFaceModel,
  );
}

function friendlyHfError(status, detail) {
  return detail; // Deprecated, using getFriendlyMessage directly
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
    console.warn('Using fallback characters:', error.message);
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
