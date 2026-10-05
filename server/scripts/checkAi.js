import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import { env, isConfiguredKey } from '../src/config/env.js';
import OpenAI from 'openai';

async function run() {
  console.log('Running AI Check...');
  
  const token = env.openaiApiKey;
  const configuredModel = env.openaiModel;

  if (!isConfiguredKey(token)) {
    console.error('FAIL: GROQ_API_KEY is missing or not configured.');
    process.exit(1);
  }
  
  try {
    console.log(`Configured model: ${configuredModel}`);
    const openai = new OpenAI({
      apiKey: token,
      baseURL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    });
    console.log(`Sending 'hi' to model...`);
    const data = await openai.chat.completions.create({ model: configuredModel, messages: [{ role: 'user', content: 'Reply with exactly OK' }], max_tokens: 80 });
    const reply = data?.choices?.[0]?.message?.content || JSON.stringify(data);
    console.log('\nPASS');
    console.log(`Model: ${configuredModel}`);
    console.log(`Reply: ${String(reply).slice(0, 200).replace(/\n/g, ' ')}`);

  } catch (err) {
    if (err.status === 401) console.error('FAIL: GROQ_API_KEY is invalid or unauthorized.');
    else if (err.status === 429 && (err.code === 'insufficient_quota' || /no credits|billing|quota/i.test(err.message || ''))) {
      console.error('FAIL: Groq account has no available credits. Check Groq limits, then run this check again.');
    } else if (err.status === 429) console.error('FAIL: Groq rate limit reached. Wait and try again.');
    else console.error(`FAIL: Exception occurred: ${err.message}`);
    process.exit(1);
  }
}

run();
