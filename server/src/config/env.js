const defaults = {
  port: 4000,
  mongoUri: '',
  openaiApiKey: '',
  openaiModel: 'openai/gpt-oss-20b',
  groqBaseUrl: 'https://api.groq.com/openai/v1',
  clientUrl: 'http://localhost:3000',
  rateLimitWindowMs: 900000,
  rateLimitMax: 40,
};

function clean(value, fallback) {
  return String(value ?? fallback).trim().replace(/^("|')|("|')$/g, '').trim();
}

function read(name, fallback) {
  return clean(process.env[name], fallback);
}

const values = {
  port: () => Number(read('PORT', defaults.port)),
  mongoUri: () => read('MONGO_URI', defaults.mongoUri),
  openaiApiKey: () => read('GROQ_API_KEY', read('OPENAI_API_KEY', defaults.openaiApiKey)),
  openaiModel: () => read('OPENAI_MODEL', defaults.openaiModel),
  groqBaseUrl: () => read('GROQ_BASE_URL', defaults.groqBaseUrl),
  clientUrl: () => read('CLIENT_URL', defaults.clientUrl),
  rateLimitWindowMs: () => Number(read('RATE_LIMIT_WINDOW_MS', defaults.rateLimitWindowMs)),
  rateLimitMax: () => Number(read('RATE_LIMIT_MAX', defaults.rateLimitMax)),
};

export const env = {};
for (const [key, getter] of Object.entries(values)) {
  Object.defineProperty(env, key, { enumerable: true, get: getter });
}

export function getAiConfigError() {
  if (isConfiguredKey(env.openaiApiKey) && env.openaiModel) return null;
  return 'AI service is not configured. Set GROQ_API_KEY, GROQ_BASE_URL, and OPENAI_MODEL in server/.env.';
}

export function isConfiguredKey(value) {
  return Boolean(value && !/^(PASTE_|paste_|replace_with_)/.test(value));
}