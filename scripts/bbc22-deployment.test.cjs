// New deployment safety boundary only; BBC-21's passing suite is reused.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { raw, validatePair, composeArgs, composeEnv, policy } = require('./deployment.cjs');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bbc22-fixtures-'));
function fixture() {
  const releases = {}, files = {};
  for (const [name, p] of Object.entries(policy)) {
    const botEnvFile = path.join(directory, name + '-bot.env'), dashboardEnvFile = path.join(directory, name + '-dashboard.env');
    fs.writeFileSync(botEnvFile, '', { flag: 'a' }); fs.writeFileSync(dashboardEnvFile, '', { flag: 'a' });
    const token = Buffer.from(p.app).toString('base64') + '.synthetic.' + name;
    files[botEnvFile] = `DISCORD_TOKEN=${token}\nGUILD_ID=${p.guild}\nGENERAL_CHANNEL_ID=1\nGIVEAWAY_CHANNEL_ID=2\nLAVA_HOST=127.0.0.1\nLAVA_PORT=1\nLAVA_PASS=synthetic\n`;
    files[dashboardEnvFile] = `DATABASE_URL=postgresql://neondb_owner:${name}-synthetic@${p.endpoint}-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require\nNEXTAUTH_SECRET=${name}\nDISCORD_CLIENT_ID=${p.app}\nDISCORD_CLIENT_SECRET=${name}\nDISCORD_TOKEN=${token}\nDISCORD_BOT_TOKEN=${token}\n`;
    releases[name] = { botEnvFile, dashboardEnvFile, botImage: 'sha256:' + 'a'.repeat(64), dashboardImage: 'sha256:' + 'b'.repeat(64), redisImage: 'sha256:' + 'c'.repeat(64), inviteUrl: 'https://discord.com/' };
  }
  return { releases, files, check() { return validatePair(releases, file => files[file]); } };
}
test('reviewed pair passes; raw dollar/quote secrets stay literal', () => {
  fixture().check(); assert.equal(raw('KEY=literal$with"quote')['KEY'], 'literal$with"quote');
});
for (const key of ['DISCORD_TOKEN', 'NEXTAUTH_SECRET', 'DATABASE_URL']) test('missing ' + key + ' refuses', () => {
  const f = fixture(), file = f.releases.development.dashboardEnvFile;
  f.files[file] = f.files[file].replace(new RegExp('^' + key + '=.*\\n', 'm'), ''); assert.throws(() => f.check(), /missing/);
});
for (const key of ['NEXTAUTH_SECRET', 'DISCORD_CLIENT_SECRET']) test('shared ' + key + ' refuses', () => {
  const f = fixture(), file = f.releases.development.dashboardEnvFile;
  f.files[file] = f.files[file].replace(new RegExp('^' + key + '=.*$', 'm'), key + '=production'); assert.throws(() => f.check(), /Shared/);
});
for (const key of ['SHADOW_DB_URL', 'NODE_OPTIONS', 'API_INTERNAL_URL', 'REDIS_HOST']) test('unexpected override ' + key + ' refuses', () => {
  const f = fixture(); f.files[f.releases.development.botEnvFile] += key + '=unsafe\n'; assert.throws(() => f.check(), /unexpected runtime key/);
});
test('production DB used for development refuses even with different password', () => {
  const f = fixture(), file = f.releases.development.dashboardEnvFile;
  f.files[file] = f.files[file].replace(policy.development.endpoint, policy.production.endpoint); assert.throws(() => f.check(), /database outside/);
});
test('same endpoint with alternate database or PostgreSQL query override refuses', () => {
  for (const replacement of ['/other?sslmode=require', '/neondb?sslmode=require&host=unsafe']) {
    const f = fixture(), file = f.releases.development.dashboardEnvFile;
    f.files[file] = f.files[file].replace('/neondb?sslmode=require', replacement); assert.throws(() => f.check());
  }
});
test('accepts required Neon channel binding and rejects weaker values', () => {
  const f = fixture(), file = f.releases.development.dashboardEnvFile;
  f.files[file] = f.files[file].replace('sslmode=require', 'sslmode=require&channel_binding=require');
  f.check();
  f.files[file] = f.files[file].replace('channel_binding=require', 'channel_binding=disable');
  assert.throws(() => f.check(), /unexpected channel binding/);
});
test('shared database password refuses across separate endpoints', () => {
  const f = fixture(), file = f.releases.development.dashboardEnvFile;
  f.files[file] = f.files[file].replace('development-synthetic', 'production-synthetic'); assert.throws(() => f.check(), /shared database password/);
});
test('swapped identity/token or shared runtime path refuses', () => {
  for (const mutate of [f => { f.releases.development.botEnvFile = f.releases.production.botEnvFile; }, f => {
    const file = f.releases.development.botEnvFile; f.files[file] = f.files[file].replace(policy.development.guild, policy.production.guild);
  }, f => { const file = f.releases.development.botEnvFile; f.files[file] = f.files[file].replace(/DISCORD_TOKEN=.*/, 'DISCORD_TOKEN=invalid'); }]) {
    const f = fixture(); mutate(f); assert.throws(() => f.check());
  }
});
test('mutable tag, duplicate env assignment and wrong invite refuse', () => {
  const f = fixture(); f.releases.development.botImage = 'botlog:latest'; assert.throws(() => f.check(), /immutable/);
  assert.throws(() => raw('KEY=a\nKEY=b'), /duplicate/);
  const g = fixture(); g.releases.development.inviteUrl = 'https://discord.com/oauth2/authorize?client_id=' + policy.production.app; assert.throws(() => g.check(), /invite identity/);
});
test('explicit Compose inputs ignore ambient project/port/env overrides', () => {
  const f = fixture(); process.env.COMPOSE_PROJECT_NAME = 'production'; process.env.DASHBOARD_PORT = '9999'; process.env.DOCKER_HOST = 'tcp://untrusted:2375';
  try {
    const env = composeEnv(f.releases.development, 'development'); assert.equal(env.DASHBOARD_PORT, '3001'); assert.equal(env.COMPOSE_PROJECT_NAME, undefined); assert.equal(env.DOCKER_HOST, undefined);
    assert.ok(composeArgs('development').includes('botlog-development')); assert.ok(composeArgs('production').includes('botlog-production')); assert.throws(() => composeArgs('other')); assert.throws(() => composeArgs('constructor'));
  } finally { delete process.env.COMPOSE_PROJECT_NAME; delete process.env.DASHBOARD_PORT; delete process.env.DOCKER_HOST; }
});
