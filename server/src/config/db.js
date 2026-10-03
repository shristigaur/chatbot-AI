import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  if (!env.mongoUri) {
    console.warn('MONGO_URI is not configured; running without persistence.');
    return;
  }

  await mongoose.connect(env.mongoUri);
  console.info('MongoDB connected');
}