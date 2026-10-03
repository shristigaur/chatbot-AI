import { env } from '../config/env.js';
import { toText } from '../utils/toText.js';
import { buildSystemPrompt } from './promptBuilder.js';

const missingConfigMessage = 'AI is not configured. Add HF_API_TOKEN to server/.env and restart the server.';
let charactersFallbackLogged = false;

export async function streamReply({ messages, ageFilter, character, onText }) {
  const context = [
    { role: 'system', content: buildSystemPrompt({ ageFilter, character }) },
    ...messages.slice(-12).map(({ role, content }) => ({ role, content: toText(content) })),
  ];

  if (!isHfConfigured()) throw new Error(missingConfigMessage);

  const response = await requestHuggingFace({ messages: context, stream: true, max_tokens: 1600 });
  if (!response.body) throw new Error('Hugging Face returned an empty response stream.');

  let fullText = '';
  await readSse(response.body, (chunk) => {
    const token = toText(chunk?.choices?.[0]?.delta?.content ?? '');
    if (token) {
      fullText += token;
      onText(token);
    }
  });
  return fullText;
}

export async function predictCharacters(messages, ageFilter) {
  if (!isHfConfigured()) {
    logCharacterFallback(missingConfigMessage);
    return fallbackCharacters(ageFilter);
  }
  const response = await requestHuggingFace({
    max_tokens: 700,
    messages: [
      { role: 'system', content: 'Return only valid JSON with exactly three characters in a characters array. Each character needs name, emoji, personality, speakingStyle, suggestedTheme, and whyThisFits.' },
      { role: 'user', content: `Age filter: ${ageFilter}. Conversation:\n${messages.slice(-8).map((item) => `${item.role}: ${toText(item.content)}`).join('\n')}` },
    ],
  });
  return parseCharacters(extractText(response), ageFilter);
}

function extractText(data) {
  return toText(data?.choices?.[0]?.message?.content);
}

async function requestHuggingFace(body) {
  let response;
  try {
    response = await fetch(env.huggingFaceUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.huggingFaceToken}`,
        'Content-Type': 'application/json',
        Accept: body.stream ? 'text/event-stream' : 'application/json',
      },
      body: JSON.stringify({ model: env.huggingFaceModel, ...body }),
    });
  } catch (error) {
    throw new Error(`Could not reach Hugging Face: ${error.message}`);
  }

  if (!response.ok) {
    const rawBody = await response.text();
    console.error('Unexpected Hugging Face response:', { status: response.status, body: rawBody.slice(0, 500) });
    let detail = response.statusText;
    try { detail = toText(JSON.parse(rawBody)); } catch { if (rawBody) detail = rawBody.slice(0, 500); }
    throw new Error(`HF ${response.status}: ${friendlyHfError(response.status, detail || response.statusText)}`);
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
  if (status === 401) return 'Invalid Hugging Face token. Check HF_API_TOKEN in server/.env.';
  if (status === 403) return 'The model is gated or your token lacks Inference Providers permission.';
  if (status === 404) return 'The Hugging Face model or endpoint was not found. Check HF_MODEL and HF_API_URL.';
  if (status === 429) return 'Hugging Face rate limit reached. Try again later.';
  if (status >= 500) return 'Hugging Face is experiencing a provider issue. Try again later.';
  return detail;
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
