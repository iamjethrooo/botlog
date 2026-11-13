const fs = require('node:fs');
const { requestLive } = require('./runtime.cjs');

async function check() {
  const service = process.argv[2];
  if (service === 'dashboard') {
    await requestLive('http://dashboard:3000');
  } else if (service === 'bot') {
    const heartbeat = Number(fs.readFileSync('/tmp/botlog-ready', 'utf8'));
    if (!heartbeat || Date.now() - heartbeat > 25000) throw new Error('Bot heartbeat is stale');
    await requestLive(process.env.API_INTERNAL_URL);
  } else {
    throw new Error('Unknown service');
  }
}

check().catch(() => { process.exitCode = 1; });
