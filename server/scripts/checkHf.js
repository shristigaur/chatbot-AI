import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const token = String(process.env.HF_API_TOKEN || '').trim().replace(/^("|')|("|')$/g, '').trim();
const url = String(process.env.HF_API_URL || '').trim().replace(/^("|')|("|')$/g, '').trim();
const model = String(process.env.HF_MODEL || '').trim().replace(/^("|')|("|')$/g, '').trim();

if (!token || token === 'PASTE_YOUR_NEW_TOKEN_HERE' || !url || !model) {
  console.error('ERROR: configure HF_API_TOKEN, HF_API_URL, and HF_MODEL in server/.env');
  process.exit(1);
}

try {
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: 'hi' }], max_tokens: 8 }),
  });
  const body = await response.text();
  if (response.ok) console.log(`OK: HF ${response.status}`);
  else console.error(`ERROR: HF ${response.status}: ${body.slice(0, 300)}`);
  process.exitCode = response.ok ? 0 : 1;
} catch (error) {
  console.error(`ERROR: HF request failed: ${error.message}`);
  process.exitCode = 1;
}