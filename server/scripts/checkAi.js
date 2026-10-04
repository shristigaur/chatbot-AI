import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../src/config/env.js';
import { modelResolver } from '../src/services/modelResolver.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  const token = env.huggingFaceToken;
  const url = env.huggingFaceUrl;
  const configModel = env.huggingFaceModel;
  let pass = true;

  if (!token || !url || !configModel) {
    console.error('FAIL: Missing AI_API_KEY, AI_API_URL, or AI_MODEL in .env');
    process.exit(1);
  }

  try {
    const modelsUrl = url.replace(/\/chat\/completions\/?$/, '/models');
    console.log(`Fetching models from ${modelsUrl}...`);
    const res = await fetch(modelsUrl, { headers: { Authorization: `Bearer ${token}` } });
    
    if (res.ok) {
      const data = await res.json();
      console.log(`Found ${data.data?.length || 0} models.`);
    } else {
      console.log(`Failed to fetch models: ${res.status}`);
    }

    console.log('Running resolveModel()...');
    const model = await modelResolver.resolveModel(url, token, configModel, true);
    console.log(`Selected model: ${model}`);
    
    if (model !== configModel) {
      console.log(`Hint: The configured model '${configModel}' was not selected. You can remove HF_MODEL/AI_MODEL from .env to rely on auto-select.`);
    }

    console.log('Sending test message...');
    const testRes = await fetch(url, {
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

    if (testRes.ok) {
      const testData = await testRes.json();
      const reply = testData.choices?.[0]?.message?.content || '';
      console.log(`PASS: Received reply: ${reply.slice(0, 200).replace(/\n/g, ' ')}`);
    } else {
      console.error(`FAIL: Request failed with status ${testRes.status}`);
      pass = false;
    }
  } catch (err) {
    console.error(`FAIL: Exception during test: ${err.message}`);
    pass = false;
  }
  
  if (!pass) process.exit(1);
}

run();
