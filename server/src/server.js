import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { identity, newAnonymousId } from './middleware/identity.js';
import { errorHandler } from './middleware/errorHandler.js';
import chatRoutes from './routes/chatRoutes.js';
import chatHistoryRoutes from './routes/chatHistoryRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();
const hasConfiguredHfUrl = Boolean(String(process.env.HF_API_URL || '').trim());
const hasConfiguredHfModel = Boolean(String(process.env.HF_MODEL || '').trim());
const hfConfigured = () => Boolean(env.huggingFaceToken && env.huggingFaceToken !== 'PASTE_YOUR_NEW_TOKEN_HERE' && env.huggingFaceModel && env.huggingFaceUrl && hasConfiguredHfUrl && hasConfiguredHfModel);
app.use(helmet());
app.use(cors({ origin: env.clientUrl }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: env.rateLimitWindowMs, limit: env.rateLimitMax, standardHeaders: 'draft-8', legacyHeaders: false }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/health', (req, res) => res.json({ ok: true, hfConfigured: hfConfigured(), model: env.huggingFaceModel }));
app.use('/api', (req, res, next) => {
  if (!req.get('x-anonymous-id') && req.method === 'GET') req.headers['x-anonymous-id'] = newAnonymousId();
  next();
}, identity);
app.use('/api/chat', chatRoutes);
app.use('/api/chats', chatHistoryRoutes);
app.use('/api/user', userRoutes);
app.use(errorHandler);

connectDatabase().then(() => app.listen(env.port, () => console.info(`Lumina server listening on ${env.port}`))).catch((error) => {
  console.error(`Startup failed: ${error.message}`);
  process.exit(1);
});

console.info(`HF token loaded: ${hfConfigured()}`);
console.info(`HF model: ${env.huggingFaceModel}`);
console.info(`HF URL: ${env.huggingFaceUrl}`);
if (!hfConfigured()) console.warn('HF_API_TOKEN, HF_MODEL, or HF_API_URL is missing or still a placeholder. Edit server/.env, not server/.env.example, then restart the server.');