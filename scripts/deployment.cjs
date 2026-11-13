// BBC-22 operator boundary. No implicit checkout .env, build, pull or migration.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const policy = {
  development: { app: '734333321231859847', guild: '1223433266237935818', endpoint: 'ep-holy-bird-a17gcbdc', port: 3001 },
  production: { app: '730410703378448394', guild: '669190303353143306', endpoint: 'ep-summer-hill-a15mzind', port: 3000 }
};
function need(ok, message) { if (!ok) throw new Error(message); }
function raw(text) {
  const result = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const m = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
    need(m && !(m[1] in result), 'Invalid or duplicate runtime assignment');
    result[m[1]] = m[2];
  }
  return result;
}
const botKeys = 'DISCORD_TOKEN GUILD_ID PREFIX GENERAL_CHANNEL_ID GIVEAWAY_CHANNEL_ID LAVA_HOST LAVA_PORT LAVA_PASS LAVA_SECURE SPOTIFY_CLIENT_ID SPOTIFY_CLIENT_SECRET TENOR_API WEATHER_API GENIUS_API RAWG_API COIN_EMOJI CHINESE'.split(' ');
const dashKeys = 'DATABASE_URL NEXTAUTH_SECRET DISCORD_CLIENT_ID DISCORD_CLIENT_SECRET DISCORD_TOKEN DISCORD_BOT_TOKEN'.split(' ');
function validatePair(releases, read = file => fs.readFileSync(file, 'utf8')) {
  const seenPaths = new Set(), parsed = {};
  for (const [name, p] of Object.entries(policy)) {
    const r = releases[name];
    need(r && Object.keys(r).sort().join() === ['botEnvFile', 'dashboardEnvFile', 'botImage', 'dashboardImage', 'redisImage', 'inviteUrl'].sort().join(), name + ': incomplete/unknown release fields');
    for (const key of ['botImage', 'dashboardImage', 'redisImage']) need(/^sha256:[a-f0-9]{64}$/.test(r[key]), name + ': immutable local image ID required for ' + key);
    for (const key of ['botEnvFile', 'dashboardEnvFile']) {
      need(path.isAbsolute(r[key]), name + ': absolute private env path required');
      const resolved = fs.realpathSync(r[key]);
      const relative = path.relative(root, resolved);
      need(relative.startsWith('..' + path.sep) || path.isAbsolute(relative), name + ': runtime files must be outside checkout');
      const canonical = process.platform === 'win32' ? resolved.toLowerCase() : resolved;
      need(!seenPaths.has(canonical), 'Shared runtime env file'); seenPaths.add(canonical);
      r[key] = resolved;
    }
    const bot = raw(read(r.botEnvFile)), dashboard = raw(read(r.dashboardEnvFile));
    for (const [values, allowed, required] of [[bot, botKeys, ['DISCORD_TOKEN', 'GUILD_ID', 'GENERAL_CHANNEL_ID', 'GIVEAWAY_CHANNEL_ID', 'LAVA_HOST', 'LAVA_PORT', 'LAVA_PASS']], [dashboard, dashKeys, dashKeys]]) {
      need(Object.keys(values).every(k => allowed.includes(k)), name + ': unexpected runtime key (use only templates; no shadow URL or overrides)');
      for (const k of required) need(values[k]?.trim(), name + ': missing ' + k);
    }
    need(bot.GUILD_ID === p.guild && dashboard.DISCORD_CLIENT_ID === p.app, name + ': Discord identity mismatch');
    need(Buffer.from(bot.DISCORD_TOKEN.split('.')[0], 'base64').toString() === p.app, name + ': bot token identity mismatch');
    need(bot.DISCORD_TOKEN === dashboard.DISCORD_TOKEN && bot.DISCORD_TOKEN === dashboard.DISCORD_BOT_TOKEN, name + ': dashboard/bot tokens differ');
    let db, invite;
    try { db = new URL(dashboard.DATABASE_URL); invite = new URL(r.inviteUrl); } catch { throw new Error(name + ': invalid database/invite URL'); }
    need(db.protocol === 'postgresql:' && [p.endpoint + '.ap-southeast-1.aws.neon.tech', p.endpoint + '-pooler.ap-southeast-1.aws.neon.tech'].includes(db.hostname) && db.pathname === '/neondb' && decodeURIComponent(db.username) === 'neondb_owner', name + ': database outside BBC-15 reviewed boundary');
    need(db.searchParams.get('sslmode') === 'require' && (!db.port || db.port === '5432'), name + ': expected Neon TLS/port');
    need([...db.searchParams.keys()].every(k => ['sslmode', 'connect_timeout', 'pool_timeout', 'pgbouncer', 'connection_limit', 'channel_binding'].includes(k)), name + ': unexpected database override');
    need(db.searchParams.getAll('channel_binding').every(value => value === 'require'), name + ': unexpected channel binding setting');
    need(r.inviteUrl === 'https://discord.com/' || (invite.protocol === 'https:' && invite.hostname === 'discord.com' && !invite.username && !invite.password && invite.pathname === '/oauth2/authorize' && invite.searchParams.get('client_id') === p.app), name + ': invite identity mismatch');
    parsed[name] = { bot, dashboard, databasePassword: db.password };
  }
  for (const k of ['DISCORD_TOKEN', 'DISCORD_CLIENT_SECRET', 'NEXTAUTH_SECRET']) need(parsed.development.dashboard[k] !== parsed.production.dashboard[k], 'Shared development/production secret: ' + k);
  need(parsed.development.dashboard.DATABASE_URL !== parsed.production.dashboard.DATABASE_URL, 'Shared database');
  need(parsed.development.databasePassword && parsed.production.databasePassword && parsed.development.databasePassword !== parsed.production.databasePassword, 'Missing or shared database password');
  return releases;
}
function composeArgs(name) {
  need(Object.hasOwn(policy, name), 'Choose development or production');
  return ['compose', '--env-file', process.platform === 'win32' ? 'NUL' : '/dev/null', '-p', 'botlog-' + name, '-f', path.join(root, 'docker-compose.yml'), '-f', path.join(root, 'docker/release.compose.yml')];
}
function composeEnv(r, name) {
  // Clear interpolation and Compose overrides inherited from the operator shell.
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(COMPOSE_|DOCKER_|BOT_|DASHBOARD_|REDIS_|NEXT_PUBLIC_)/i.test(k)));
  return { ...env, BOT_ENV_FILE: r.botEnvFile, DASHBOARD_ENV_FILE: r.dashboardEnvFile,
    BOT_IMAGE: r.botImage, DASHBOARD_IMAGE: r.dashboardImage, REDIS_IMAGE: r.redisImage,
    DASHBOARD_PORT: String(policy[name].port), NEXT_PUBLIC_INVITE_URL: r.inviteUrl };
}
function docker(args, env) {
  const result = spawnSync('docker', [...(process.platform === 'win32' ? ['--context', 'desktop-linux'] : []), ...args], { cwd: root, env, encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  // Never forward config/environment/error output: it can contain credentials.
  need(result.status === 0, 'Docker command failed; inspect locally without publishing resolved env/config');
  return result.stdout;
}
function verifyConfig(c, r, name) {
  const project = 'botlog-' + name;
  need(c.name === project, 'Unexpected Compose project');
  need(Object.keys(c.services).sort().join() === 'bot,dashboard,redis', 'Unexpected services');
  for (const service of ['bot', 'dashboard', 'redis']) {
    const s = c.services[service];
    need(!s.build && s.image === r[service + 'Image'] && s.pull_policy === 'never', 'Build/pull or unpinned service');
    need(!s.network_mode && Object.keys(s.networks).join() === 'default', 'Unexpected service network');
    need(!s.container_name, 'Fixed container name');
    if (service !== 'dashboard') need(!s.ports?.length, 'Unexpected published port');
  }
  const ports = c.services.dashboard.ports;
  need(ports?.length === 1 && ports[0].host_ip === '127.0.0.1' && Number(ports[0].published) === policy[name].port && ports[0].target === 3000, 'Unexpected dashboard binding');
  need(c.networks.default.name === project + '_default' && !c.networks.default.external, 'Shared network');
  for (const [service, volume, target] of [['bot', 'bot_data', '/app/packages/bot/data'], ['redis', 'redis_data', '/data']]) {
    const mounts = c.services[service].volumes;
    need(mounts?.length === 1 && mounts[0].type === 'volume' && mounts[0].source === volume && mounts[0].target === target, 'Unexpected persistent mount');
    need(c.volumes[volume].name === project + '_' + volume && !c.volumes[volume].external, 'Shared volume');
  }
  need(!c.services.dashboard.volumes?.length, 'Unexpected dashboard mount');
  need(c.services.bot.environment.REDIS_HOST === 'redis' && c.services.bot.environment.API_INTERNAL_URL === 'http://dashboard:3000', 'Unexpected service routing');
}
function main(argv) {
  const [action, manifest, name, ...flags] = argv;
  need(['check', 'up', 'stop', 'status', 'logs'].includes(action) && manifest && flags.every(f => f === '--approved-start' || f === '--approved-production-action'), 'Usage: node scripts/deployment.cjs check|up|stop|status|logs PRIVATE_RELEASES.json development|production [approval flags]');
  need(Object.hasOwn(policy, name), 'Choose development or production');
  const releases = validatePair(JSON.parse(fs.readFileSync(manifest, 'utf8')));
  for (const n of Object.keys(policy)) verifyConfig(JSON.parse(docker([...composeArgs(n), 'config', '--format', 'json'], composeEnv(releases[n], n))), releases[n], n);
  if (action === 'check') { console.log('Both environment identities, pinned images, private volumes/networks and loopback ports validated (configuration only).'); return; }
  if (action === 'up') need(flags.includes('--approved-start'), 'Startup can write database/Discord state: obtain explicit approval, then use --approved-start');
  if (name === 'production' && ['up', 'stop'].includes(action)) need(flags.includes('--approved-production-action'), 'Production change requires separate explicit approval');
  const r = releases[name], env = composeEnv(r, name);
  if (action === 'up') for (const key of ['botImage', 'dashboardImage', 'redisImage']) need(JSON.parse(docker(['image', 'inspect', r[key]], env))[0].Id === r[key], 'Reviewed image is not present locally');
  const command = { up: ['up', '-d', '--no-build', '--pull', 'never', '--wait', '--wait-timeout', '180'], stop: ['stop'], status: ['ps', '-a'], logs: ['logs', '--tail', '50'] }[action];
  const output = docker([...composeArgs(name), ...command], env);
  // Logs are operator-only and may include application data; never put in Linear.
  console.log(['status', 'logs'].includes(action) ? output : name + ': ' + action + ' completed; volumes retained.');
}
module.exports = { raw, validatePair, composeArgs, composeEnv, verifyConfig, policy };
if (require.main === module) { try { main(process.argv.slice(2)); } catch (error) { console.error('Deployment refused: ' + (error.code || error instanceof SyntaxError ? 'file access/JSON/configuration failure' : error.message)); process.exitCode = 1; } }
