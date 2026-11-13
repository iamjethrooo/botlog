// Isolated fixtures. No .env, database, Redis, Discord, or real topic state.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies = {}, globals = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
  }).outputText;
  vm.runInNewContext(source, { exports, URL, process: { env: {} }, console,
    require(id) { if (id in dependencies) return dependencies[id]; throw Error('Unexpected import: ' + id); },
    ...globals });
  return exports;
}
const env = { NEXTAUTH_URL: 'http://127.0.0.1:3000', API_INTERNAL_URL: 'http://dashboard:3000' };
const { guardApiRequest } = load('packages/dashboard/src/server/request-guard.ts');
function guard(headers = {}, method = 'POST', json = true, configuration = env) {
  let status = 200;
  const passed = guardApiRequest({ headers: { host: '127.0.0.1:3000', 'content-type': 'application/json', ...headers }, method },
    { status(code) { status = code; return this; }, json() {} }, json, configuration);
  return { passed, status };
}
test('canonical browser JSON and Origin-less internal bot queries/mutations pass', () => {
  for (const method of ['GET', 'POST']) {
    assert.equal(guard({ origin: env.NEXTAUTH_URL, 'sec-fetch-site': 'same-origin' }, method).passed, true);
    assert.equal(guard({ host: 'dashboard:3000' }, method).passed, true);
  }
  assert.equal(guard({ 'content-type': 'application/json; charset=utf-8' }).passed, true);
  assert.equal(guard({ 'content-type': 'application/x-www-form-urlencoded', origin: env.NEXTAUTH_URL }, 'POST', false).passed, true);
});
test('foreign Origin, DNS rebinding Host and cross-site requests reject before handlers', () => {
  for (const headers of [
    { origin: 'https://evil.example' }, { origin: 'null' }, { origin: env.NEXTAUTH_URL + '/path' },
    { origin: ['http://127.0.0.1:3000'] }, { host: 'evil.example:3000' }, { host: 'localhost:3000' },
    { host: '127.0.0.1:3001' }, { host: undefined }, { 'sec-fetch-site': 'cross-site' },
    { host: 'dashboard:3000', origin: env.NEXTAUTH_URL }, { host: 'dashboard:3000', 'sec-fetch-site': 'same-origin' },
  ]) assert.equal(guard(headers).status, 403);
  assert.equal(guard({ host: 'evil.example', 'x-forwarded-host': '127.0.0.1:3000' }).status, 403);
});
test('tRPC mutations require JSON and invalid server configuration fails closed', () => {
  for (const type of [undefined, 'text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data', 'application/json-patch+json']) {
    assert.equal(guard({ 'content-type': type }).status, 415);
  }
  assert.equal(guard({}, 'POST', true, {}).status, 503);
});
test('actual API wrapper never invokes tRPC for rejected requests', () => {
  let calls = 0;
  const { default: handler } = load('packages/dashboard/src/pages/api/trpc/[trpc].ts', {
    '@trpc/server/adapters/next': { createNextApiHandler: () => () => { calls++; } },
    '@bbc-bot/api/src/routers/index': { appRouter: {} }, '@bbc-bot/api/src/createContext': {},
    '../../../server/request-guard': { guardApiRequest: (req, res) => guardApiRequest(req, res, true, env) }
  });
  const res = { status() { return this; }, json() {} };
  handler({ headers: { host: 'evil.example' }, method: 'GET' }, res);
  handler({ headers: { host: '127.0.0.1:3000', 'content-type': 'text/plain' }, method: 'POST' }, res);
  assert.equal(calls, 0);
  handler({ headers: { host: 'dashboard:3000', 'content-type': 'application/json' }, method: 'POST' }, res);
  assert.equal(calls, 1);
});
test('only top-level sign-in, error and Discord callback GETs can cross sites', () => {
  let calls = 0, status;
  const { default: auth } = load('packages/dashboard/src/pages/api/auth/[...nextauth].ts', {
    'next-auth': { __esModule: true, default: () => () => { calls++; } },
    'next-auth/providers/discord': { __esModule: true, default: value => value },
    '@next-auth/prisma-adapter': { PrismaAdapter() {} }, '@bbc-bot/api/src/db/client': {},
    '../../../env/server.mjs': { env }, '../../../server/discord-identity': {},
    '../../../server/request-guard': { guardApiRequest }
  }, { process: { env } });
  const headers = { host: '127.0.0.1:3000', 'sec-fetch-site': 'cross-site',
    'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document' };
  const res = { status(code) { status = code; return this; }, json() {} };
  auth({ method: 'GET', headers, query: { nextauth: ['callback', 'discord'] } }, res);
  auth({ method: 'GET', headers, query: { nextauth: ['signin'] } }, res);
  auth({ method: 'GET', headers, query: { nextauth: ['error'], error: 'AccessDenied' } }, res);
  assert.equal(calls, 3);
  for (const change of [
    { method: 'POST' }, { method: 'POST', query: { nextauth: ['signin'] } },
    { method: 'POST', query: { nextauth: ['error'] } },
    { query: { nextauth: ['signin', 'discord'] } },
    { query: { nextauth: ['session'] } },
    { headers: { ...headers, origin: 'https://discord.com' } },
    { headers: { ...headers, 'sec-fetch-mode': 'cors' } },
    { headers: { ...headers, host: 'dashboard:3000' } },
  ]) {
    auth({ method: 'GET', headers, query: { nextauth: ['callback', 'discord'] }, ...change }, res);
    assert.equal(status, 403); assert.equal(calls, 3);
  }
});
test('health executes only SELECT 1, returns 503 on dependency failure and rejects writes', async () => {
  let reads = 0, fail = false, status;
  const { default: health } = load('packages/dashboard/src/pages/api/health.ts', {
    '@bbc-bot/api/src/db/client': { prisma: { $queryRaw: async sql => { assert.equal(sql[0], 'SELECT 1'); reads++; if (fail) throw Error('offline'); } } },
    '../../server/request-guard': { guardApiRequest: () => true }
  });
  const res = { setHeader() {}, status(code) { status = code; return this; }, json() {}, end() {} };
  await health({ method: 'GET' }, res); assert.equal(status, 200);
  fail = true; await health({ method: 'GET' }, res); assert.equal(status, 503);
  await health({ method: 'POST' }, res); assert.equal(status, 405); assert.equal(reads, 2);
});
test('both recurring Docker probes use database-free liveness while startup readiness checks PostgreSQL', async () => {
  const requests = [];
  let reads = 0, unavailable = true;
  const guard = { guardApiRequest: (req, res) => guardApiRequest(req, res, false, env) };
  const { default: live } = load('packages/dashboard/src/pages/api/live.ts', {
    '../../server/request-guard': guard
  });
  const { default: health } = load('packages/dashboard/src/pages/api/health.ts', {
    '../../server/request-guard': guard,
    '@bbc-bot/api/src/db/client': { prisma: { $queryRaw: async () => {
      reads++;
      if (unavailable) throw Error('offline');
    } } }
  });
  const runtimeModule = {};
  load('docker/runtime.cjs', {
    'node:http': { get(url, callback) {
      requests.push(url.pathname);
      const handler = { '/api/live': live, '/api/health': health }[url.pathname];
      let statusCode;
      void handler({ method: 'GET', headers: { host: url.host } }, {
        setHeader() {},
        status(code) { statusCode = code; return this; },
        json() { callback({ statusCode, resume() {} }); }
      });
      return { setTimeout() {}, on() {} };
    } }
  }, { module: runtimeModule });
  const runtime = runtimeModule.exports;
  async function probe(service, heartbeatAge = 0) {
    const process = { argv: ['node', 'healthcheck', service], env };
    load('docker/healthcheck.cjs', {
      './runtime.cjs': runtime,
      'node:fs': { readFileSync: () => String(Date.now() - heartbeatAge) }
    }, { process });
    await new Promise(resolve => setImmediate(resolve));
    return process.exitCode;
  }
  assert.equal(await probe('dashboard'), undefined);
  assert.equal(await probe('bot'), undefined);
  assert.equal(await probe('bot', 30000), 1);
  assert.deepEqual(requests, ['/api/live', '/api/live']);
  assert.equal(reads, 0);
  await assert.rejects(runtime.requestReady(env.API_INTERNAL_URL), /api\/health/);
  unavailable = false;
  await runtime.requestReady(env.API_INTERNAL_URL);
  assert.deepEqual(requests, ['/api/live', '/api/live', '/api/health', '/api/health']);
  assert.equal(reads, 2);
});
test('topic seeding preserves changed and exhausted state across simulated recreation', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bbc21-topics-'));
  const seedDirectory = path.join(directory, 'src/resources/other'); fs.mkdirSync(seedDirectory, { recursive: true });
  fs.writeFileSync(path.join(seedDirectory, 'topics.txt'), 'first\nsecond');
  const dependencies = { fs, path };
  const globals = { __dirname: path.join(directory, 'dist/lib') };
  const file = load('packages/bot/src/lib/topicState.ts', dependencies, globals).topicFile({ BOT_DATA_DIR: path.join(directory, 'data') });
  assert.equal(fs.readFileSync(file, 'utf8'), 'first\nsecond');
  fs.writeFileSync(file, 'second');
  load('packages/bot/src/lib/topicState.ts', dependencies, globals).topicFile({ BOT_DATA_DIR: path.dirname(file) });
  assert.equal(fs.readFileSync(file, 'utf8'), 'second');
  fs.writeFileSync(file, '');
  load('packages/bot/src/lib/topicState.ts', dependencies, globals).topicFile({ BOT_DATA_DIR: path.dirname(file) });
  assert.equal(fs.readFileSync(file, 'utf8'), '');
});
test('shutdown cancels app timers, stops collectors and drains already active work', async () => {
  const scheduled = new Set(); let stopped = 0, finish;
  const timers = { setTimeout: (fn, delay) => { const t = { fn, delay }; scheduled.add(t); return t; },
    clearTimeout: t => scheduled.delete(t), setInterval: fn => { const t = { fn }; scheduled.add(t); return t; },
    clearInterval: t => scheduled.delete(t) };
  const lifecycle = load('packages/bot/src/lib/lifecycle.ts', { timers });
  lifecycle.setTimeout(() => assert.fail('shutdown timer fired'), 1000);
  lifecycle.setInterval(() => assert.fail('shutdown interval fired'), 1000);
  lifecycle.trackCollector({ once() {}, stop(reason) { assert.equal(reason, 'shutdown'); stopped++; } });
  lifecycle.trackWork(new Promise(resolve => { finish = resolve; }));
  lifecycle.beginShutdown(); assert.equal(lifecycle.isStopping(), true);
  assert.equal(scheduled.size, 0); assert.equal(stopped, 1);
  assert.throws(() => lifecycle.setTimeout(() => {}, 1), /stopping/);
  finish(); await Promise.resolve(); await Promise.resolve();
  assert.equal(await lifecycle.drainWork(), true);
});
test('runtime settings fail without leaking values and readiness retries/timeout are bounded', async () => {
  const { requireEnv, waitFor } = require('../docker/runtime.cjs');
  assert.throws(() => requireEnv({ TOKEN: 'sensitive' }, ['TOKEN', 'GUILD_ID']), { message: 'Missing runtime settings: GUILD_ID' });
  let attempts = 0;
  await waitFor(async () => { if (++attempts < 3) throw Error('delayed'); }, { timeout: 100, interval: 1 });
  assert.equal(attempts, 3);
  await assert.rejects(waitFor(async () => { throw Error('down'); }, { timeout: 2, interval: 1 }), /timed out/);
});
test('dashboard production wrapper guards Host and drains HTTP before exiting on SIGTERM', async () => {
  const signals = {}, exits = []; let listener, closeCallback, nextClosed = false, handled = 0;
  const server = { listen(port, host, fn) { assert.equal(port, 3000); assert.equal(host, '0.0.0.0'); fn(); },
    close(fn) { closeCallback = fn; } };
  const next = options => {
    assert.equal(options.dev, false);
    return { prepare: async () => {}, getRequestHandler: () => () => { handled++; },
      close: async () => { nextClosed = true; } };
  };
  const dependencies = { './runtime.cjs': require('../docker/runtime.cjs'),
    './check-migrations.cjs': { checkMigrations: async () => {}, reportMigrationError: assert.fail },
    'node:http': { createServer(fn) { listener = fn; return server; } }, next };
  const requireFixture = id => dependencies[id]; requireFixture.resolve = () => 'next';
  const environment = { ...env, DATABASE_URL: 'synthetic', NEXTAUTH_SECRET: 'synthetic',
    DISCORD_CLIENT_ID: 'synthetic', DISCORD_CLIENT_SECRET: 'synthetic', DISCORD_TOKEN: 'synthetic' };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../docker/dashboard-start.cjs'), 'utf8'), {
    require: requireFixture, URL, Set, console: { log() {}, error() {} },
    process: { env: environment, on(event, fn) { signals[event] = fn; }, exit(code) { exits.push(code); } },
    setTimeout() { return { unref() {} }; }
  });
  await new Promise(resolve => setImmediate(resolve));
  let status;
  listener({ headers: { host: 'foreign.invalid:3000' } }, { writeHead(code) { status = code; }, end() {} });
  assert.equal(status, 403); assert.equal(handled, 0);
  listener({ headers: { host: 'dashboard:3000' } }, {}); assert.equal(handled, 1);
  signals.SIGTERM(); assert.equal(nextClosed, false); assert.deepEqual(exits, []);
  closeCallback(); await Promise.resolve(); await Promise.resolve();
  assert.equal(nextClosed, true); assert.deepEqual(exits, [0]);
});

test('dashboard refuses to prepare or listen when its migration check fails', async () => {
  const exits = [];
  const failure = new Error('missing migration');
  let reported;
  const dependencies = {
    './runtime.cjs': require('../docker/runtime.cjs'),
    './check-migrations.cjs': {
      checkMigrations: async () => { throw failure; },
      reportMigrationError: error => { reported = error; }
    },
    'node:http': { createServer: () => assert.fail('HTTP server created') },
    next: () => ({ prepare: () => assert.fail('Next prepared') })
  };
  const requireFixture = id => dependencies[id];
  requireFixture.resolve = () => 'next';
  const environment = { ...env, DATABASE_URL: 'synthetic', NEXTAUTH_SECRET: 'synthetic',
    DISCORD_CLIENT_ID: 'synthetic', DISCORD_CLIENT_SECRET: 'synthetic', DISCORD_TOKEN: 'synthetic' };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../docker/dashboard-start.cjs'), 'utf8'), {
    require: requireFixture, URL, Set, console: { error() {} },
    process: { env: environment, exit(code) { exits.push(code); } }
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(reported, failure);
  assert.deepEqual(exits, [1]);
});
