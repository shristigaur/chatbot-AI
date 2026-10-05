const defaults = {
  port: 4000,
  mongoUri: '',
  huggingFaceToken: '',
  huggingFaceUrl: 'https://router.huggingface.co/v1/chat/completions',
  huggingFaceModel: 'Qwen/Qwen2.5-7B-Instruct',
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
  huggingFaceToken: () => read('AI_API_KEY', read('HF_API_TOKEN', defaults.huggingFaceToken)),
  huggingFaceUrl: () => read('AI_API_URL', read('HF_API_URL', defaults.huggingFaceUrl)),
  huggingFaceModel: () => read('AI_MODEL', read('HF_MODEL', defaults.huggingFaceModel)),
  modelFallback: () => read('AI_MODEL_FALLBACK', ''),
  fallbackToken: () => read('AI_FALLBACK_KEY', ''),
  fallbackUrl: () => read('AI_FALLBACK_URL', ''),
  fallbackModel: () => read('AI_FALLBACK_MODEL', ''),
  clientUrl: () => read('CLIENT_URL', defaults.clientUrl),
  rateLimitWindowMs: () => Number(read('RATE_LIMIT_WINDOW_MS', defaults.rateLimitWindowMs)),
  rateLimitMax: () => Number(read('RATE_LIMIT_MAX', defaults.rateLimitMax)),
};

export const env = {};
for (const [key, getter] of Object.entries(values)) {
  Object.defineProperty(env, key, { enumerable: true, get: getter });
}

export function getAiConfigError() {
  const hasPrimary = Boolean(
    env.huggingFaceToken &&
    env.huggingFaceToken !== 'PASTE_YOUR_NEW_TOKEN_HERE' &&
    env.huggingFaceUrl &&
    env.huggingFaceModel
  );
  const hasFallback = Boolean(env.fallbackToken && env.fallbackUrl && env.fallbackModel);
  if (hasPrimary || hasFallback) return null;
  return 'AI service is not configured. Set AI_API_KEY (or HF_API_TOKEN), AI_API_URL (or HF_API_URL), and AI_MODEL (or HF_MODEL) in server/.env.';
}