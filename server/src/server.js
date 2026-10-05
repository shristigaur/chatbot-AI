import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import listEndpoints from 'express-list-endpoints';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { identity, newAnonymousId } from './middleware/identity.js';
import { errorHandler } from './middleware/errorHandler.js';
import chatRoutes from './routes/chatRoutes.js';
import chatHistoryRoutes from './routes/chatHistoryRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { modelResolver } from './services/modelResolver.js';
import { getProviderStatus } from './services/aiService.js';

const app = express();
const hasConfiguredHfUrl = Boolean(String(process.env.AI_API_URL || process.env.HF_API_URL || '').trim());
const hasConfiguredHfModel = Boolean(String(process.env.AI_MODEL || process.env.HF_MODEL || '').trim());
const hfConfigured = () => Boolean(env.huggingFaceToken && env.huggingFaceToken !== 'PASTE_YOUR_NEW_TOKEN_HERE' && env.huggingFaceModel && env.huggingFaceUrl && hasConfiguredHfUrl && hasConfiguredHfModel);
const allowedOrigins = env.clientUrl.split(',').map((origin) => origin.trim().replace(/\/+$/, '')).filter(Boolean);
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/+$/, ''))) return callback(null, true);
    return callback(new Error('CORS origin is not allowed.'));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-anonymous-id', 'Authorization'],
  credentials: true,
};
app.use(helmet());
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: env.rateLimitWindowMs, limit: env.rateLimitMax, standardHeaders: 'draft-8', legacyHeaders: false }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/', (req, res) => res.json({ name: 'Lumina API', status: 'running', health: '/api/health' }));
app.get('/api/health', async (req, res) => {
  const model = await modelResolver.resolveModel(env.huggingFaceUrl, env.huggingFaceToken, env.huggingFaceModel);
  let provider = env.huggingFaceUrl;
  try { provider = new URL(env.huggingFaceUrl).host; } catch (e) {}
  res.json({ ok: true, provider, model, ready: hfConfigured(), providers: getProviderStatus() });
});
if (env.nodeEnv === 'development') {
  app.use((req, res, next) => {
    // console.log(`${req.method} ${req.url}`);
    next();
  });
}



app.use('/api', (req, res, next) => {
  if (!req.get('x-anonymous-id') && req.method === 'GET') req.headers['x-anonymous-id'] = newAnonymousId();
  next();
}, identity);
app.get('/api/test', (req, res) => res.json({ ok: true }));
app.use('/api/chat', chatRoutes);
app.use('/api/chats', chatHistoryRoutes);
app.use('/api/user', userRoutes);
app.use('/api', (req, res) => {
  console.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'API route not found.' });
});
app.use((req, res) => {
  console.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found.' });
});
app.use((err, req, res, next) => {
  console.error('Global error:', err.message);
  res.status(err.status || 500).json({ error: err.friendlyMessage || 'Server error (500)', code: err.status || 500 });
});

connectDatabase().then(() => {
  app.listen(env.port, '0.0.0.0', () => {
    console.info(`Lumina server listening on ${env.port}`);
    if (env.nodeEnv === 'development') {
      console.log('Registered Routes:');
      console.log(listEndpoints(app));
    }
  });
}).catch((error) => {
  console.error(`Startup failed: ${error.message}`);
  process.exit(1);
});

console.info(`AI token loaded: ${hfConfigured()}`);
console.info(`AI model: ${env.huggingFaceModel}`);
let aiHost = env.huggingFaceUrl;
try { aiHost = new URL(env.huggingFaceUrl).host; } catch (e) {}
console.info(`AI host: ${aiHost}`);
if (!hfConfigured()) console.warn('AI_API_KEY, AI_MODEL, or AI_API_URL is missing. Edit server/.env and restart.');