import { closeDb } from '../src/lib/server/db.js';
import { getConfig } from '../src/lib/server/env.js';
import { deliverMailBatch } from '../src/lib/server/worker.js';

let stopping = false;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const config = getConfig();

  while (!stopping) {
    const processed = await deliverMailBatch(config.workerBatchSize);
    if (processed === 0) {
      await sleep(config.workerPollIntervalMs);
    }
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    stopping = true;
    await closeDb();
    process.exit(0);
  });
}

await run().catch(async (error) => {
  console.error('Worker failed', error);
  await closeDb();
  process.exit(1);
});
