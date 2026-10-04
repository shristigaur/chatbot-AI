import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import { env } from '../src/config/env.js';
import { modelResolver } from '../src/services/modelResolver.js';

async function run() {
  console.log('Running AI Check...');
  
  const token = env.huggingFaceToken;
  const url = env.huggingFaceUrl;
  const configuredModel = env.huggingFaceModel;

  if (!token || token === 'PASTE_YOUR_NEW_TOKEN_HERE') {
    console.error('FAIL: AI_API_KEY / HF_API_TOKEN is missing or not configured.');
    process.exit(1);
  }
  if (!url) {
    console.error('FAIL: AI_API_URL / HF_API_URL is missing.');
    process.exit(1);
  }
  
  try {
    console.log(`Configured model: ${configuredModel}`);
    console.log(`Resolving model via ${url}...`);
    
    // Resolve model
    const model = await modelResolver.resolveModel(url, token, configuredModel, true);
    console.log(`Resolved model: ${model}`);

    // Send "hi"
    console.log(`Sending 'hi' to model...`);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 5,
        stream: false
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`FAIL: API returned ${res.status}`);
      console.error(errorText.slice(0, 300));
      process.exit(1);
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || JSON.stringify(data);
    console.log('\nPASS');
    console.log(`Model: ${model}`);
    console.log(`Reply: ${String(reply).slice(0, 200).replace(/\n/g, ' ')}`);

  } catch (err) {
    console.error(`FAIL: Exception occurred: ${err.message}`);
    process.exit(1);
  }
}

run();
