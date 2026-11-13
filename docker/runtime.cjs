const http = require('node:http');

function requireEnv(env, keys) {
  const missing = keys.filter(key => !env[key]?.trim());
  if (missing.length) throw new Error(`Missing runtime settings: ${missing.join(', ')}`);
}

function requestStatus(origin, pathname, timeout) {
  return new Promise((resolve, reject) => {
    const request = http.get(new URL(pathname, origin), response => {
      response.resume();
      response.statusCode === 200 ? resolve() : reject(new Error(`Dashboard probe failed: ${pathname}`));
    });
    request.setTimeout(timeout, () => request.destroy(new Error(`Dashboard probe timed out: ${pathname}`)));
    request.on('error', reject);
  });
}

function requestReady(origin, timeout = 3000) {
  return requestStatus(origin, '/api/health', timeout);
}

function requestLive(origin, timeout = 3000) {
  return requestStatus(origin, '/api/live', timeout);
}

async function waitFor(check, { timeout = 120000, interval = 2000 } = {}) {
  const deadline = Date.now() + timeout;
  while (true) {
    try { await check(); return; }
    catch {
      if (Date.now() >= deadline) throw new Error('Dependency readiness timed out');
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
}

module.exports = { requireEnv, requestReady, requestLive, waitFor };
