// Offline identity fixtures + a synthetic loopback HTTP API. No env files or real records.
// Run: node --test scripts/bbc20-auth-config.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { once } = require('node:events');
const root = path.resolve(__dirname, '..');
const nextAuthRoot = path.dirname(require.resolve('next-auth'));
const core = file => require(path.join(nextAuthRoot, 'core', file));
const A = '123456789012345678', B = '223456789012345678';
const origin = 'http://127.0.0.1:3001';
const env = { NEXTAUTH_URL: origin, DISCORD_CLIENT_ID: 'fixture', DISCORD_CLIENT_SECRET: 'fixture' };
const { getApiUrl } = require('../packages/node/api-url.cjs');
const { localOptions } = require('./dashboard-local.cjs');
function load(file, deps, globals = {}) {
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, URL, Date, ...globals, require(id) {
    if (id in deps) return deps[id];
    throw Error('Fixture forbids import: ' + id);
  } }, { filename: file });
  return exports;
}
const identity = load('packages/dashboard/src/server/discord-identity.ts', {});
const requestGuard = load('packages/dashboard/src/server/request-guard.ts', {}, { process: { env } });
const signIn = load('packages/dashboard/src/shared/sign-in-url.ts', {});
function fixture(users = []) {
  let state = { users: structuredClone(users), accounts: [], sessions: [], writes: [] };
  let queue = Promise.resolve(), failures = [], accountFailures = [], count = 0;
  const match = (rows, where) => rows.find(row => Object.entries(where).every(([k, v]) => row[k] === v));
  function db() {
    return {
      user: {
        findUnique: async ({ where }) => match(state.users, where) || null,
        create: async ({ data }) => {
          assert.ok(!state.users.some(u => u.discordId === data.discordId || (data.email && u.email === data.email)));
          const user = { id: 'new-' + (++count), cash: 0, ...data };
          state.users.push(user); state.writes.push(['user', structuredClone(data)]); return user;
        }
      },
      account: {
        findUnique: async ({ where, include, select }) => {
          const row = where.id ? match(state.accounts, where) : match(state.accounts, where.provider_providerAccountId);
          if (!row) return null;
          const user = match(state.users, { id: row.userId });
          return include?.user || select?.user ? { ...row, user } : row;
        },
        create: async ({ data }) => {
          if (accountFailures.shift()) throw Error('fixture account insert failure');
          assert.ok(!state.accounts.some(a => a.provider === data.provider && a.providerAccountId === data.providerAccountId));
          const row = { id: 'account-' + (++count), ...data }; state.accounts.push(row);
          state.writes.push(['account-create', structuredClone(data)]); return row;
        },
        update: async ({ where, data }) => {
          const row = match(state.accounts, where); assert.ok(row);
          Object.assign(row, Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)));
          state.writes.push(['account-update', structuredClone(data)]); return row;
        }
      },
      session: {
        create: async ({ data }) => { const row = { id: 'session-' + (++count), ...data }; state.sessions.push(row); return row; },
        findUnique: async ({ where }) => {
          const row = match(state.sessions, where);
          return row ? { ...row, user: match(state.users, { id: row.userId }) } : null;
        },
        update: async ({ where, data }) => Object.assign(match(state.sessions, where), data),
        delete: async ({ where }) => { const row = match(state.sessions, where); state.sessions = state.sessions.filter(s => s !== row); return row; }
      }
    };
  }
  const prisma = { ...db(), $transaction(fn, options) {
    assert.equal(options.isolationLevel, 'Serializable');
    const result = queue.then(async () => {
      const before = structuredClone(state);
      try {
        const failure = failures.shift();
        if (failure) throw Object.assign(Error('synthetic transaction failure'), { code: failure });
        return await fn(db());
      } catch (e) { state = before; throw e; }
    });
    queue = result.catch(() => {}); return result;
  } };
  return { prisma, get state() { return state; }, failures, accountFailures };
}
function user(id = A) {
  return { id: 'bot-' + id, discordId: id, email: null, cash: 97500,
    items: [{ itemId: 'fixture', quantity: 3 }], guilds: [{ ownerId: id }],
    reminders: [{ id: 'reminder' }], jailTime: '10', failedRobAttempts: 2 };
}
function oauth(id = A, extra = {}) {
  return { provider: 'discord', type: 'oauth', providerAccountId: id,
    access_token: 'fixture-token', refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, ...extra };
}
function profile(id = A, extra = {}) { return { id, username: 'Fixture', email: null, avatar: null, ...extra }; }
function options(f) {
  const nextAuth = { __esModule: true, default: x => x };
  const provider = require('next-auth/providers/discord');
  const { authOptions } = load('packages/dashboard/src/pages/api/auth/[...nextauth].ts', {
    'next-auth': nextAuth, 'next-auth/providers/discord': provider,
    '@next-auth/prisma-adapter': require('@next-auth/prisma-adapter'),
    '@bbc-bot/api/src/db/client': { prisma: f.prisma },
    '../../../env/server.mjs': { env }, '../../../server/discord-identity': identity,
    '../../../server/request-guard': requestGuard
  });
  let sequence = 0;
  return { ...authOptions, callbacks: { ...core('lib/default-callbacks.js').defaultCallbacks, ...authOptions.callbacks },
    session: { ...authOptions.session, updateAge: 86400, generateSessionToken: () => 'token-' + (++sequence) },
    provider: { id: 'discord', type: 'oauth' }, events: {}, jwt: {},
    cookies: { sessionToken: { name: 'fixture-session', options: {} } },
    logger: { debug() {}, error() {} }, url: origin + '/api/auth', callbackUrl: origin + '/dashboard' };
}
async function login(f, opts, { raw = profile(), account = oauth(), sessionToken, failExchange } = {}) {
  const file = path.join(nextAuthRoot, 'core/routes/callback.js');
  const exports = {};
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), { exports, URL, URLSearchParams, Date,
    require(id) {
      if (id === '../lib/oauth/callback') return { default: async () => {
        if (failExchange) throw Object.assign(Error('fixture OAuth failure'), { name: 'OAuthCallbackError' });
        const mapped = opts.providers[0].options.profile(raw);
        return { profile: mapped, account, OAuthProfile: raw, cookies: [] };
      }, __esModule: true };
      return require(require.resolve(id, { paths: [path.dirname(file)] }));
    }
  });
  return exports.default({ options: opts, query: {}, body: {}, method: 'GET', cookies: {},
    sessionStore: { value: sessionToken } });
}

for (const kind of ['new', 'bot-only', 'linked']) test(kind + ': callback/repeated login preserves identity and relations', async () => {
  const original = user();
  const f = fixture(kind === 'new' ? [] : [original]);
  const opts = options(f);
  if (kind === 'linked') await identity.linkDiscordIdentity(f.prisma, oauth(), profile());
  if (kind !== 'new') f.state.sessions.push({ sessionToken: 'prior', userId: original.id, expires: new Date(Date.now() + 86400000) });
  for (let i = 0; i < 2; i++) {
    const result = await login(f, opts, { account: oauth(A, { access_token: 'renewed-' + i }) });
    assert.equal(result.redirect, origin + '/dashboard');
    assert.ok(result.cookies.some(c => c.name === 'fixture-session'));
  }
  assert.equal(f.state.users.length, 1); assert.equal(f.state.accounts.length, 1);
  assert.equal(f.state.accounts[0].userId, f.state.users[0].id);
  assert.equal(f.state.accounts[0].access_token, 'renewed-1');
  if (kind !== 'new') {
    assert.deepEqual(f.state.users[0], original);
    assert.ok(f.state.sessions.some(s => s.sessionToken === 'prior'));
    assert.equal(f.state.writes.filter(w => w[0] === 'user').length, 0);
  }
});

test('parallel first logins and transient conflicts converge without duplicate users/accounts', async () => {
  const f = fixture(); f.failures.push('P2034', 'P2002');
  const results = await Promise.all(Array.from({ length: 8 }, () => identity.linkDiscordIdentity(f.prisma, oauth(), profile())));
  assert.ok(results.every(Boolean)); assert.equal(f.state.users.length, 1); assert.equal(f.state.accounts.length, 1);
});
for (const conflict of ['email', 'linked-owner', 'provider-id', 'provider', 'expired', 'missing-token', 'bad-id']) {
  test(conflict + ': rejects without changing any record or issuing a session', async () => {
    const f = fixture([user(), { ...user(B), email: 'other@example.invalid' }]);
    let raw = profile(), account = oauth();
    if (conflict === 'email') raw.email = 'other@example.invalid';
    if (conflict === 'linked-owner') f.state.accounts.push({ id: 'bad', userId: user(B).id, provider: 'discord', providerAccountId: A });
    if (conflict === 'provider-id') account.providerAccountId = B;
    if (conflict === 'provider') account.provider = 'other';
    if (conflict === 'expired') account.expires_at = 1;
    if (conflict === 'missing-token') account.access_token = '';
    if (conflict === 'bad-id') raw.id = '';
    const before = structuredClone(f.state);
    const result = await login(f, options(f), { raw, account });
    assert.match(result.redirect, /error\?error=AccessDenied$/);
    assert.deepEqual(f.state, before);
    assert.ok(!result.cookies.some(c => c.name === 'fixture-session'));
  });
}
test('email already on the same bot user links by Discord ID', async () => {
  const f = fixture([{ ...user(), email: 'same@example.invalid' }]);
  const result = await login(f, options(f), { raw: profile(A, { email: 'SAME@example.invalid' }) });
  assert.equal(result.redirect, origin + '/dashboard'); assert.equal(f.state.users.length, 1);
});
test('transaction failure rolls back new identity; failed OAuth exchange has no writes', async () => {
  const f = fixture(); f.failures.push('P1001');
  assert.equal(await identity.linkDiscordIdentity(f.prisma, oauth(), profile()), false);
  assert.equal(f.state.users.length, 0); assert.equal(f.state.accounts.length, 0);
  const result = await login(f, options(f), { failExchange: true });
  assert.match(result.redirect, /error\?error=OAuthCallback$/); assert.equal(f.state.sessions.length, 0);
});
test('account insert failure rolls back an already inserted user, and retry exhaustion fails closed', async () => {
  const f = fixture(); f.accountFailures.push(true);
  const result = await login(f, options(f));
  assert.match(result.redirect, /AccessDenied$/);
  assert.equal(f.state.users.length, 0); assert.equal(f.state.accounts.length, 0); assert.equal(f.state.sessions.length, 0);
  f.failures.push('P2034', 'P2034', 'P2034');
  assert.equal(await identity.linkDiscordIdentity(f.prisma, oauth(), profile()), false);
  assert.equal(f.state.users.length, 0); assert.equal(f.failures.length, 0);
});
test('signed-in identity mismatch cannot reassign accounts or replace the current session', async () => {
  const f = fixture([user(), user(B)]), opts = options(f);
  f.state.sessions.push({ sessionToken: 'other-session', userId: user(B).id, expires: new Date(Date.now() + 100000) });
  const result = await login(f, opts, { sessionToken: 'other-session' });
  assert.match(result.redirect, /OAuthAccountNotLinked$/);
  assert.equal(f.state.accounts[0].userId, user().id);
  assert.equal(f.state.sessions.length, 1); assert.equal(f.state.sessions[0].userId, user(B).id);
  assert.deepEqual(f.state.users, [user(), user(B)]);
});
test('session identity, OAuth expiry, missing account and reauthentication', async () => {
  const f = fixture([user()]), opts = options(f);
  await login(f, opts);
  const session = () => ({ user: {}, expires: new Date(Date.now() + 100000).toISOString() });
  const fresh = await opts.callbacks.session({ session: session(), user: f.state.users[0] });
  assert.equal(fresh.user.id, user().id); assert.equal(fresh.user.discordId, A); assert.equal(fresh.error, undefined);
  assert.ok(!JSON.stringify(fresh).includes('fixture-token'));
  f.state.accounts[0].expires_at = 1;
  const expired = await opts.callbacks.session({ session: session(), user: f.state.users[0] });
  assert.equal(expired.error, 'DiscordTokenExpired');
  const guards = load('packages/dashboard/src/shared/get-server-session.ts', {
    'next-auth': { unstable_getServerSession: async () => expired },
    '../pages/api/auth/[...nextauth]': { authOptions: opts }, './sign-in-url': signIn
  });
  assert.equal(await guards.getServerSession({ req: {}, res: {} }), null);
  const context = load('packages/api/src/createContext.ts', {
    'next-auth': { unstable_getServerSession: async () => expired },
    '../../dashboard/src/pages/api/auth/[...nextauth]': { authOptions: opts }, './db/client': { prisma: f.prisma }
  });
  assert.equal((await context.createContext({ req: {}, res: {} })).session, null);
  await login(f, opts);
  assert.equal((await opts.callbacks.session({ session: session(), user: f.state.users[0] })).error, undefined);
  f.state.accounts.length = 0;
  assert.equal((await opts.callbacks.session({ session: session(), user: f.state.users[0] })).error, 'DiscordTokenExpired');
});
test('page session guard redirects missing and expired sessions with the original destination', async () => {
  const fresh = { user: { id: 'user-id' } };
  let currentSession;
  const { requirePageSession } = load('packages/dashboard/src/shared/get-server-session.ts', {
    'next-auth': { unstable_getServerSession: async () => currentSession },
    '../pages/api/auth/[...nextauth]': {}, './sign-in-url': signIn
  });
  const ctx = { req: {}, res: {}, resolvedUrl: '/dashboard/123/commands?view=roles&sort=name' };
  for (const invalid of [null, { user: {} }, { ...fresh, error: 'DiscordTokenExpired' }]) {
    currentSession = invalid;
    const { redirect } = await requirePageSession(ctx);
    assert.equal(redirect.permanent, false);
    const target = new URL(redirect.destination, origin);
    assert.equal(target.origin, origin);
    assert.equal(target.pathname, '/signin');
    assert.equal(target.searchParams.get('callbackUrl'), ctx.resolvedUrl);
  }
  currentSession = fresh;
  assert.equal((await requirePageSession(ctx)).props.session, fresh);
});
test('sign-in return paths preserve app routes and reject external or auth destinations', () => {
  for (const path of ['/', '/dashboard', '/dashboard/123/commands?view=roles#editor']) {
    assert.equal(signIn.resolveSignInReturnPath(path, origin), path);
    assert.equal(signIn.resolveSignInReturnPath(origin + path, origin), path);
  }
  for (const path of [undefined, '/signin', '/api/auth/signout', '//foreign.invalid/dashboard', 'https://foreign.invalid/', 'javascript:alert(1)']) {
    assert.equal(signIn.resolveSignInReturnPath(path, origin), '/dashboard');
  }
});
test('NextAuth session expiry/logout/errors preserve user data and other sessions', async () => {
  const f = fixture([user()]), opts = options(f); await login(f, opts);
  const store = { value: 'token-1', clean: () => [{ name: 'fixture-session', value: '', options: { maxAge: 0 } }] };
  const route = core('routes/session.js').default;
  assert.equal((await route({ options: opts, sessionStore: store })).body.user.id, user().id);
  f.state.sessions[0].expires = new Date(0);
  assert.deepEqual((await route({ options: opts, sessionStore: store })).body, {});
  assert.equal(f.state.sessions.length, 0);
  await login(f, opts); await login(f, opts);
  const result = await core('routes/signout.js').default({ options: opts, sessionStore: { ...store, value: 'token-2' } });
  assert.equal(result.cookies[0].options.maxAge, 0); assert.equal(f.state.sessions.length, 1);
  assert.deepEqual(f.state.users[0], user());
  const broken = { ...opts, adapter: { ...opts.adapter, getSessionAndUser: async () => { throw Error('fixture DB outage'); } } };
  assert.deepEqual((await route({ options: broken, sessionStore: store })).body, {});
});
test('NextAuth retains state checks and missing/bad state is rejected', async () => {
  const checks = core('lib/oauth/checks.js');
  const opts = { provider: { checks: ['state'] }, cookies: { state: { name: 'fixture-state' } }, jwt: { secret: 'fixture' } };
  await assert.rejects(checks.state.use({}, [], opts, {}), /State cookie was missing/);
  await assert.rejects(checks.state.use({ 'fixture-state': 'bad' }, [], opts, {}));
});
test('Discord callback validates its current issuer and state before token exchange', async () => {
  const opts = options(fixture());
  const provider = core('lib/providers.js').default({ providers: opts.providers, providerId: 'discord', url: new URL(origin + '/api/auth') }).provider;
  const client = await core('lib/oauth/client.js').openidClient({ provider });
  assert.equal(client.issuer.issuer, 'https://discord.com');
  let grants = 0;
  client.grant = async () => { grants++; return new (require('openid-client').TokenSet)({ access_token: 'fixture', token_type: 'Bearer' }); };
  await assert.rejects(client.oauthCallback(provider.callbackUrl, { code: 'fixture', state: 'same', iss: 'https://foreign.invalid' }, { state: 'same' }), /iss mismatch/);
  await assert.rejects(client.oauthCallback(provider.callbackUrl, { code: 'fixture', state: 'other', iss: 'https://discord.com' }, { state: 'same' }), /state mismatch/);
  assert.equal(grants, 0);
  const token = await client.oauthCallback(provider.callbackUrl, { code: 'fixture', state: 'same', iss: 'https://discord.com' }, { state: 'same' });
  assert.equal(token.access_token, 'fixture'); assert.equal(grants, 1);
});
test('callback redirects stay on the canonical browser origin', () => {
  const opts = options(fixture());
  for (const url of ['https://foreign.invalid', '//foreign.invalid', 'http://localhost:3001', 'javascript:alert(1)']) {
    assert.equal(opts.callbacks.redirect({ url, baseUrl: origin }), origin);
  }
  assert.equal(opts.callbacks.redirect({ url: '/dashboard', baseUrl: 'http://dashboard:3000' }), origin + '/dashboard');
  assert.equal(opts.providers[0].options.allowDangerousEmailAccountLinking, undefined);
  const parser = core('lib/providers.js').default;
  const parsed = parser({ providers: opts.providers, providerId: 'discord', url: new URL(origin + '/api/auth') });
  assert.equal(parsed.provider.callbackUrl, origin + '/api/auth/callback/discord');
  assert.ok(parsed.provider.checks.includes('state'));
  const raw = load('packages/dashboard/src/pages/api/auth/[...nextauth].ts', {
    'next-auth': { __esModule: true, default: x => x }, 'next-auth/providers/discord': require('next-auth/providers/discord'),
    '@next-auth/prisma-adapter': require('@next-auth/prisma-adapter'), '@bbc-bot/api/src/db/client': { prisma: fixture().prisma },
    '../../../env/server.mjs': { env }, '../../../server/discord-identity': identity,
    '../../../server/request-guard': requestGuard
  }).authOptions;
  assert.equal(raw.pages.signIn, '/signin');
  assert.equal(raw.pages.error, '/signin');
  assert.equal(raw.pages.signOut, undefined);
});
test('installed NextAuth uses the custom sign-in page and keeps OAuth and CSRF checks', async () => {
  const file = path.join(nextAuthRoot, 'core/index.js'), exports = {};
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), { exports, Request, URL, Date, URLSearchParams,
    require(id) {
      if (id === '../utils/detect-origin') return { detectOrigin: () => origin };
      return require(require.resolve(id, { paths: [path.dirname(file)] }));
    }
  });
  const opts = { ...options(fixture()), secret: 'fixture-secret', logger: { debug() {}, error() {}, warn() {} } };
  async function request(action, extra = {}) {
    return exports.AuthHandler({ options: opts, req: { action, method: 'GET', cookies: {}, headers: {}, query: { nextauth: [action] }, ...extra } });
  }
  const signin = await request('signin', { query: { nextauth: ['signin'], callbackUrl: '/dashboard/123?view=roles' } });
  const destination = new URL(signin.redirect, origin);
  assert.equal(destination.pathname, '/signin');
  assert.equal(destination.searchParams.get('callbackUrl'), origin + '/dashboard/123?view=roles');
  const signout = await request('signout'); assert.match(signout.body, /Sign out/i);
  const error = await request('error', { error: 'AccessDenied' });
  assert.equal(error.redirect, '/signin?error=AccessDenied');
  const callback = await request('callback', { providerId: 'discord', query: { nextauth: ['callback', 'discord'], code: 'fixture' } });
  assert.match(callback.redirect, /error=OAuthCallback/);
  const noCsrf = await request('signin', { method: 'POST', providerId: 'discord', body: {} });
  assert.match(noCsrf.redirect, /csrf=true/);
  const csrf = await request('csrf');
  const cookies = Object.fromEntries(csrf.cookies.map(cookie => [cookie.name, cookie.value]));
  const start = await request('signin', {
    method: 'POST', providerId: 'discord', cookies,
    body: { csrfToken: csrf.body.csrfToken, callbackUrl: '/dashboard/123?view=roles' }
  });
  const authorization = new URL(start.redirect);
  assert.equal(authorization.origin, 'https://discord.com');
  assert.equal(authorization.searchParams.get('redirect_uri'), origin + '/api/auth/callback/discord');
  assert.ok(authorization.searchParams.get('state'));
  assert.equal(start.cookies.find(cookie => cookie.name === 'next-auth.callback-url')?.value, origin + '/dashboard/123?view=roles');
});
test('URL precedence, loopback launch and invalid configuration', async () => {
  assert.equal(getApiUrl({ NEXTAUTH_URL: origin }), origin + '/api/trpc');
  assert.equal(getApiUrl({ NEXTAUTH_URL: origin, NEXTAUTH_URL_INTERNAL: 'http://dashboard:3000' }), 'http://dashboard:3000/api/trpc');
  assert.equal(getApiUrl({ API_INTERNAL_URL: 'http://dashboard:3000', NEXTAUTH_URL_INTERNAL: origin }), 'http://dashboard:3000/api/trpc');
  assert.throws(() => getApiUrl({}));
  for (const value of ['ws://dashboard:2022', 'http://dashboard/api/trpc', 'http://user:password@dashboard', 'http://dashboard?x=1']) {
    assert.throws(() => getApiUrl({ API_INTERNAL_URL: value }));
  }
  for (const port of [3000, 3001, 4321]) assert.deepEqual(localOptions({ NEXTAUTH_URL: 'http://127.0.0.1:' + port }), ['--hostname', '127.0.0.1', '--port', String(port)]);
  assert.throws(() => localOptions({ NEXTAUTH_URL: 'http://0.0.0.0:3000' }));
  const { serverSchema } = await import('../packages/dashboard/src/env/schema.mjs');
  const input = { NEXTAUTH_SECRET: 'fixture', DISCORD_CLIENT_ID: 'fixture', DISCORD_CLIENT_SECRET: 'fixture' };
  assert.ok(serverSchema.safeParse({ ...input, NEXTAUTH_URL: origin }).success);
  assert.equal(serverSchema.safeParse({ ...input, NEXTAUTH_URL: 'http://public.invalid' }).success, false);
  assert.equal(serverSchema.safeParse({ ...input, NEXTAUTH_URL: 'bad' }).success, false);
  assert.equal(serverSchema.safeParse({ ...input, NEXTAUTH_URL: origin, API_INTERNAL_URL: 'ws://dashboard:2022' }).success, false);
});
test('local launcher resolves Next from the dashboard workspace, without starting a real process', () => {
  const module = { exports: {} }; let launched;
  const dashboard = path.join(root, 'packages/dashboard');
  function fixtureRequire(id) {
    if (id === 'node:path') return path;
    if (id === '../packages/node/api-url.cjs') return { getApiUrl };
    if (id === 'dotenv') return { config() {} };
    if (id === 'node:child_process') return { spawn(executable, args, options) { launched = { executable, args, options }; return { on() {} }; } };
    throw Error('Unexpected launcher import');
  }
  fixtureRequire.main = module;
  fixtureRequire.resolve = (id, options) => {
    assert.equal(id, 'next/dist/bin/next');
    assert.equal(options.paths[0], dashboard);
    return path.join(dashboard, 'node_modules/next/dist/bin/next');
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'scripts/dashboard-local.cjs'), 'utf8'), {
    module, require: fixtureRequire, __dirname: path.join(root, 'scripts'), URL,
    process: { argv: ['node', 'launcher', 'dev'], env: { NEXTAUTH_URL: origin }, execPath: 'fixture-node' }
  });
  assert.equal(launched.options.cwd, dashboard);
  assert.equal(launched.args[0], path.join(dashboard, 'node_modules/next/dist/bin/next'));
  assert.equal(launched.args.slice(1).join(' '), 'dev --hostname 127.0.0.1 --port 3001');
});
test('bot HTTP, shared Node batching and React server/browser choose the correct transport', async () => {
  const { initTRPC } = require('@trpc/server');
  const { createHTTPHandler } = require('@trpc/server/adapters/standalone');
  const superjson = require('superjson');
  const t = initTRPC.create({ transformer: superjson.default });
  let calls = 0;
  const router = t.router({ ping: t.procedure.query(() => { calls++; return { ok: true }; }), write: t.procedure.mutation(() => { calls++; return 'written'; }) });
  const handler = createHTTPHandler({ router });
  const server = require('node:http').createServer((req, res) => {
    assert.ok(req.url.startsWith('/api/trpc/')); req.url = req.url.replace('/api/trpc', ''); handler(req, res);
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const internal = 'http://127.0.0.1:' + server.address().port;
  try {
    const deps = { '@trpc/client': require('@trpc/client'), '@trpc/client/links/httpLink': require('@trpc/client/links/httpLink'),
      'superjson': superjson, 'node-fetch': require('node-fetch'), '@bbc-bot/node/api-url.cjs': { getApiUrl: () => getApiUrl({ API_INTERNAL_URL: internal }) },
      './api-url.cjs': { getApiUrl: () => getApiUrl({ API_INTERNAL_URL: internal }) },
      './lib/lifecycle': { isStopping: () => false, trackWork: p => p },
      dotenv: { config() {} }, path };
    for (const file of ['packages/bot/src/trpc.ts', 'packages/node/trpc.ts']) {
      const client = load(file, deps, { __dirname: path.dirname(path.join(root, file)) }).trpcNode;
      assert.deepEqual(await client.ping.query(), { ok: true }); assert.equal(await client.write.mutate(), 'written');
    }
    let config;
    const reactDeps = { ...deps, '@trpc/next': { createTRPCNext: x => { config = x.config; return x; } },
      '@trpc/client': { httpBatchLink: x => x } };
    load('packages/react/trpc.tsx', reactDeps);
    assert.equal(config({}).links[0].url, internal + '/api/trpc');
    load('packages/react/trpc.tsx', reactDeps, { window: {} });
    assert.equal(config({}).links[0].url, '/api/trpc');
    assert.equal(calls, 4);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
