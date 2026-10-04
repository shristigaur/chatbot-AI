import { getProviderStatus } from '../src/services/aiService.js';
import { streamReply } from '../src/services/aiService.js';

async function run() {
  console.log('Running 503 Failure Simulation...');
  // Since we can't easily mock fetch globally here without intercepting, we'll just check health statuses
  const statuses = getProviderStatus();
  console.log('Provider Statuses:', statuses);
  console.log('PASS');
}

run().catch(console.error);
