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
  huggingFaceToken: () => read('HF_API_TOKEN', defaults.huggingFaceToken),
  huggingFaceUrl: () => read('HF_API_URL', defaults.huggingFaceUrl),
  huggingFaceModel: () => read('HF_MODEL', defaults.huggingFaceModel),
  clientUrl: () => read('CLIENT_URL', defaults.clientUrl),
  rateLimitWindowMs: () => Number(read('RATE_LIMIT_WINDOW_MS', defaults.rateLimitWindowMs)),
  rateLimitMax: () => Number(read('RATE_LIMIT_MAX', defaults.rateLimitMax)),
};

export const env = {};
for (const [key, getter] of Object.entries(values)) {
  Object.defineProperty(env, key, { enumerable: true, get: getter });
}