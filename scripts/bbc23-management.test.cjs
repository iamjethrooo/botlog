// Isolated Discord and database fixtures. No credentials or live resources.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { initTRPC } = require('@trpc/server');
const { TRPCError } = require('@trpc/server');
const root = path.resolve(__dirname, '..');
const t = initTRPC.context().create();

function load(file, deps, globals = {}) {
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, URL, ...globals, require(id) {
    if (id in deps) return deps[id];
    return require(id);
  } }, { filename: file });
  return exports;
}
function fixture(fetch, memberships = [{ id: 'guild', owner: false, permissions: '9007199254741000' }]) {
  const discord = load('packages/api/src/discord.ts', { '@trpc/server': { TRPCError } }, { globalThis: {
    fetch: (url, init) => memberships && url.includes('/users/@me/guilds?') && init.headers.Authorization === 'Bearer oauth'
      ? Promise.resolve(response(200, memberships))
      : fetch(url, init)
  } });
  const guildAccess = load('packages/api/src/guildAccess.ts', { './discord': discord });
  const management = load('packages/api/src/commandManagement.ts', { './discord': discord },
    { process: { env: { DISCORD_CLIENT_ID: 'app', DISCORD_TOKEN: 'bot' } } });
  const permissions = load('packages/api/src/commandPermissions.ts', {});
  const activity = load('packages/api/src/dashboardActivity.ts', {});
  const featureHealth = load('packages/api/src/guildFeatureHealth.ts', { './discord': discord },
    { process: { env: { DISCORD_CLIENT_ID: '100000000000000010', DISCORD_TOKEN: 'bot' } } });
  const deps = { '../trpc': { t }, '../discord': discord,
    '../commandManagement': management, '../commandPermissions': permissions, '../guildAccess': guildAccess,
    '../dashboardActivity': activity, '../guildFeatureHealth': featureHealth,
    '../economy': load('packages/api/src/economy.ts', {}) };
  return {
    command: load('packages/api/src/routers/command.ts', deps, { process: { env: { DISCORD_CLIENT_ID: 'app', DISCORD_TOKEN: 'bot' } } }).commandRouter,
    hub: load('packages/api/src/routers/hub.ts', deps, { process: { env: { DISCORD_TOKEN: 'bot' } } }).hubRouter,
    guild: load('packages/api/src/routers/guild.ts', deps, { process: { env: { DISCORD_TOKEN: 'bot' } } }).guildRouter,
  };
}
const response = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const session = { user: { id: 'user', discordId: 'discord-user' } };
const account = { findUnique: async () => ({ userId: 'user', access_token: 'oauth' }) };
const plain = value => JSON.parse(JSON.stringify(value));

function settingsFixture(settings) {
  let current = settings;
  const activity = [];
  const failures = [];
  const prisma = {
    account,
    guild: { findUnique: async () => current },
    async $transaction(operation, options) {
      assert.equal(options.isolationLevel, 'Serializable');
      let next = current;
      const pending = [];
      const result = await operation({
        guild: {
          findUnique: async () => next,
          update: async ({ data }) => {
            const { disabledCommands, ...rest } = data;
            next = { ...next, ...rest };
            if (disabledCommands) next.disabledCommands = Array.from(disabledCommands.set);
            return next;
          }
        },
        dashboardActivity: { create: async ({ data }) => pending.push(plain(data)) }
      });
      if (failures.length) throw Object.assign(new Error('Fixture rollback'), { code: failures.shift() });
      current = next;
      activity.push(...pending);
      return result;
    }
  };
  return { prisma, activity, failures, settings: () => current };
}

test('guild list requires bot membership and Discord owner or Administrator permission', async () => {
  const firstPage = [
    { id: 'owner-guild' }, { id: 'member-guild' }, { id: 'invalid-guild' },
    ...Array.from({ length: 197 }, (_, index) => ({ id: `other-${index}` })),
  ];
  const routers = fixture(async (url, init) => {
    assert.equal(init.headers.Authorization, 'Bot bot');
    assert.equal(new URL(url).pathname, '/api/v10/users/@me/guilds');
    const after = new URL(url).searchParams.get('after');
    if (!after) return response(200, firstPage);
    assert.equal(after, 'other-196');
    return response(200, [{ id: 'admin-guild' }]);
  }, [
    { id: 'owner-guild', owner: true },
    { id: 'admin-guild', owner: false, permissions: '9007199254741000' },
    { id: 'former-guild', owner: true },
    { id: 'member-guild', owner: false, permissions: '32' },
    { id: 'invalid-guild', owner: false, permissions: 'invalid' },
  ]);
  const prisma = { account, guild: {
    findMany: async ({ where }) => {
      assert.deepEqual(Array.from(where.id.in), ['owner-guild', 'admin-guild']);
      return [{ id: 'owner-guild' }];
    },
    findUnique: async ({ where }) => ({ id: where.id, ownerId: 'someone-else' }),
  }, user: { findUnique: async () => ({ id: 'user' }) } };
  const guild = routers.guild.createCaller({ session, prisma });
  const listed = await guild.getAll();
  assert.deepEqual(Array.from(listed.apiGuilds, x => x.id), ['owner-guild', 'admin-guild']);
  assert.deepEqual(Array.from(listed.dbGuilds, x => x.id), ['owner-guild']);
  assert.equal((await guild.getGuildAndUser({ id: 'admin-guild' })).guild.id, 'admin-guild');
  await assert.rejects(guild.getGuildAndUser({ id: 'member-guild' }), { code: 'FORBIDDEN' });
  await assert.rejects(routers.command.createCaller({ session, prisma }).toggleCommand({
    guildId: 'member-guild', commandId: 'command', status: true,
  }), { code: 'FORBIDDEN' });
  await assert.rejects(routers.hub.createCaller({ session, prisma }).delete({ guildId: 'member-guild' }), { code: 'FORBIDDEN' });
});

test('guild commands are selected by guild and only bot-enforced commands can toggle', async () => {
  const calls = [];
  const routers = fixture(async (url) => { calls.push(url); return response(200, url.endsWith('/guilds/guild/commands') ? [] : [
    { id: 'one', type: 1, name: 'play' }, { id: 'two', type: 1, name: 'ping' }
  ]); });
  const store = settingsFixture({ disabledCommands: ['one'] });
  const caller = routers.command.createCaller({ session, prisma: store.prisma });
  const listed = await caller.getCommands({ guildId: 'guild' });
  assert.deepEqual(Array.from(listed.commands, c => c.toggleSupported), [true, false]);
  assert.ok(calls.some(url => /\/applications\/app\/guilds\/guild\/commands$/.test(url)));
  assert.ok(calls.some(url => /\/applications\/app\/commands$/.test(url)));
  await assert.rejects(caller.toggleCommand({ guildId: 'guild', commandId: 'two', status: true }), { code: 'BAD_REQUEST' });
  const enable = { guildId: 'guild', commandId: 'one', status: false };
  store.failures.push('P2034');
  await caller.toggleCommand(enable);
  await caller.toggleCommand(enable);
  assert.deepEqual(store.settings().disabledCommands, []);
  assert.deepEqual(store.activity, [{
    guildId: 'guild', actorDiscordId: 'discord-user', kind: 'COMMAND_TOGGLE', commandName: '/play',
    before: { enabled: false }, after: { enabled: true }
  }]);
  store.failures.push('P2021');
  await assert.rejects(caller.toggleCommand({ ...enable, status: true }), /Fixture rollback/);
  assert.deepEqual(store.settings().disabledCommands, []);
  assert.equal(store.activity.length, 1);
});

test('recent activity is limited to 25 newest events from the authorized bot server', async () => {
  const guildId = '100000000000000001';
  const otherId = '100000000000000002';
  let botChecks = 0;
  let reads = 0;
  const routers = fixture(async (url, init) => {
    botChecks++;
    assert.equal(init.headers.Authorization, 'Bot bot');
    return url.endsWith(guildId) ? response(200, { id: guildId }) : response(404, { message: 'Unknown guild' });
  }, [{ id: guildId, owner: true }, { id: otherId, permissions: '8' }]);
  const prisma = { account, dashboardActivity: { findMany: async input => {
    reads++;
    assert.deepEqual(plain(input), {
      where: { guildId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 25
    });
    return [{ id: 1 }];
  } } };
  const caller = routers.guild.createCaller({ session, prisma });
  await assert.rejects(caller.getRecentActivity({ guildId: '100000000000000003' }), { code: 'FORBIDDEN' });
  await assert.rejects(routers.guild.createCaller({ session: null, prisma }).getRecentActivity({ guildId }), { code: 'UNAUTHORIZED' });
  assert.equal(botChecks, 0);
  await assert.rejects(caller.getRecentActivity({ guildId: otherId }), { code: 'NOT_FOUND' });
  assert.equal(reads, 0);
  assert.deepEqual(await caller.getRecentActivity({ guildId }), [{ id: 1 }]);
});

test('welcome settings require guild access and a valid destination before enabling', async () => {
  const guildId = '100000000000000001';
  const text = '100000000000000002';
  const voice = '100000000000000003';
  const other = '100000000000000004';
  const empty = { welcomeMessageEnabled: false, welcomeMessageChannel: null, welcomeMessage: null };
  const writes = [];
  const prisma = { account, guild: {
    findUnique: async () => empty,
    update: async ({ where, data }) => {
      assert.equal(where.id, guildId);
      writes.push(plain(data));
      return data;
    }
  } };
  const routers = fixture(async (url, init) => {
    assert.ok(url.endsWith(`/guilds/${guildId}/channels`));
    assert.equal(init.headers.Authorization, 'Bot bot');
    return response(200, [{ id: text, name: 'welcome', type: 0 }, { id: voice, name: 'voice', type: 2 }]);
  }, [{ id: guildId, permissions: '8' }, { id: other, permissions: '32' }]);
  const caller = routers.guild.createCaller({ session, prisma });
  assert.deepEqual(plain(await caller.getWelcomeSettings({ guildId })), {
    settings: empty, channels: [{ id: text, name: 'welcome' }]
  });
  const update = { guildId, enabled: true, channelId: text, message: ' Welcome {member}! ' };
  await assert.rejects(caller.updateWelcomeSettings({ ...update, guildId: other }), { code: 'FORBIDDEN' });
  await assert.rejects(caller.updateWelcomeSettings({ ...update, channelId: voice }), { code: 'BAD_REQUEST' });
  await assert.rejects(caller.updateWelcomeSettings({ ...update, channelId: other }), { code: 'BAD_REQUEST' });
  await assert.rejects(caller.updateWelcomeSettings({ ...update, message: '  ' }), { code: 'BAD_REQUEST' });
  assert.equal(writes.length, 0);
  await caller.updateWelcomeSettings(update);
  await caller.updateWelcomeSettings({ ...update, enabled: false });
  assert.deepEqual(writes, [
    { welcomeMessageEnabled: true, welcomeMessageChannel: text, welcomeMessage: 'Welcome {member}!' },
    { welcomeMessageEnabled: false, welcomeMessageChannel: text, welcomeMessage: 'Welcome {member}!' }
  ]);
});

test('feature health checks validate channels and permissions and preserve disabled states when Discord fails', async () => {
  const { ChannelType, PermissionFlagsBits: permission, OverwriteType } = require('discord-api-types/v10');
  const guildId = '100000000000000001';
  const botId = '100000000000000010';
  const roleId = 'bot-role';
  const permissions = (permission.ViewChannel | permission.SendMessages | permission.Connect |
    permission.ManageChannels | permission.MoveMembers | permission.MuteMembers | permission.DeafenMembers | permission.Stream).toString();
  const category = { id: 'category', type: ChannelType.GuildCategory };
  const voice = { id: 'voice', type: ChannelType.GuildVoice, parent_id: category.id };
  const welcome = { id: 'text', type: ChannelType.GuildText, name: 'welcome' };
  const settings = { hub: category.id, hubChannel: voice.id, welcomeMessageEnabled: true,
    welcomeMessageChannel: welcome.id, welcomeMessage: 'Welcome!' };
  let channels = [category, voice, welcome];
  let discordAvailable = true;
  let admin = false;
  let calls = 0;
  const routers = fixture(async (url, init) => {
    calls++;
    assert.equal(init.headers.Authorization, 'Bot bot');
    assert.ok(!init.method || init.method === 'GET');
    if (!discordAvailable) return response(503, {});
    if (url.endsWith('/channels')) return response(200, channels);
    if (url.endsWith(`/members/${botId}`)) return response(200, { roles: [roleId] });
    return response(200, { id: guildId, roles: [
      { id: guildId, permissions: '0' }, { id: roleId, permissions: admin ? '8' : permissions }
    ] });
  }, [{ id: guildId, owner: true }]);
  const caller = routers.guild.createCaller({ session, prisma: {
    account, guild: { findUnique: async ({ where }) => {
      assert.equal(where.id, guildId);
      return settings;
    } }
  } });
  await assert.rejects(caller.getChannelFeatureHealth({ guildId: '100000000000000002' }), { code: 'FORBIDDEN' });
  assert.equal(calls, 0);
  let health = await caller.getChannelFeatureHealth({ guildId });
  assert.equal(health.voice.state, 'healthy');
  assert.equal(health.welcome.state, 'healthy');
  channels = [category, { ...welcome, permission_overwrites: [{
    id: botId, type: OverwriteType.Member, allow: '0', deny: permission.SendMessages.toString(),
  }] }];
  health = await caller.getChannelFeatureHealth({ guildId });
  assert.equal(health.voice.state, 'attention');
  assert.match(health.voice.detail, /saved voice channel is missing/);
  assert.equal(health.welcome.state, 'attention');
  assert.match(health.welcome.detail, /Send Messages/);
  channels.push({ ...voice, parent_id: 'other-category' });
  admin = true;
  health = await caller.getChannelFeatureHealth({ guildId });
  assert.match(health.voice.detail, /outside its configured category/);
  assert.equal(health.welcome.state, 'healthy');
  discordAvailable = false;
  settings.welcomeMessageEnabled = false;
  health = await caller.getChannelFeatureHealth({ guildId });
  assert.equal(health.voice.state, 'unavailable');
  assert.equal(health.welcome.state, 'disabled');
  const checksBeforeDisabled = calls;
  settings.hub = settings.hubChannel = null;
  health = await caller.getChannelFeatureHealth({ guildId });
  assert.equal(health.voice.state, 'disabled');
  assert.equal(calls, checksBeforeDisabled);
});

test('the welcome listener renders placeholders without pinging mentions and skips unavailable channels', async () => {
  const { ChannelType, PermissionFlagsBits } = require('discord.js');
  const sent = [];
  let reads = 0;
  let canSend = true;
  const settings = { welcomeMessageEnabled: true, welcomeMessageChannel: 'text',
    welcomeMessage: 'Welcome {member} to {server}! @everyone' };
  const { GuildMemberAddListener } = load('packages/bot/src/listeners/guildMemberAdd.ts', {
    '@sapphire/decorators': { ApplyOptions: () => constructor => constructor },
    '@sapphire/framework': { Listener: class {} },
    'discord.js': { ChannelType, PermissionFlagsBits },
    '../trpc': { trpcNode: { guild: { getGuild: { query: async ({ id }) => {
      assert.equal(id, 'guild');
      reads++;
      return { guild: settings };
    } } } } }
  });
  const listener = new GuildMemberAddListener();
  const member = { displayName: 'Alex', user: { bot: false }, guild: {
    id: 'guild', name: 'Test server', members: { me: {} },
    channels: { cache: new Map([['text', {
      type: ChannelType.GuildText,
      permissionsFor: () => ({ has: () => canSend }),
      send: async message => sent.push(plain(message))
    }]]) }
  } };
  await listener.run(member);
  await listener.run({ ...member, user: { bot: true } });
  assert.equal(reads, 1);
  settings.welcomeMessageEnabled = false;
  await listener.run(member);
  settings.welcomeMessageEnabled = true;
  canSend = false;
  await listener.run(member);
  settings.welcomeMessageChannel = 'deleted';
  await listener.run(member);
  assert.deepEqual(sent, [{
    content: 'Welcome Alex to Test server! @everyone', allowedMentions: { parse: [] }
  }]);
});

test('command detail uses guild scope and permission errors remain failures', async () => {
  const calls = [];
  const routers = fixture(async (url) => {
    calls.push(url);
    if (url.endsWith('/permissions')) return response(403, { message: 'Missing permissions' });
    if (url.endsWith('/applications/app/commands')) return response(200, [{ id: 'one', type: 1, name: 'play' }]);
    return response(200, url.endsWith('/commands/one') ? { id: 'one', name: 'play' } : []);
  });
  const prisma = { account };
  await assert.rejects(routers.command.createCaller({ session, prisma }).getCommandAndGuildChannels({ guildId: 'guild', commandId: 'one' }),
    error => error.code === 'FORBIDDEN' && /403/.test(error.message));
  assert.ok(calls.some(url => url.endsWith('/applications/app/commands/one')));
  assert.ok(!calls.some(url => url.endsWith('/guilds/guild/commands/one')));
});

test('guild registration takes precedence over same-name global command', async () => {
  const calls = [];
  const routers = fixture(async url => {
    calls.push(url);
    if (url.endsWith('/guilds/guild/commands')) return response(200, [{ id: 'local', name: 'play', type: 1 }]);
    if (url.endsWith('/applications/app/commands')) return response(200, [{ id: 'global', name: 'play', type: 1 }]);
    if (url.endsWith('/permissions')) return response(200, { permissions: [] });
    return response(200, url.endsWith('/commands/local') ? { id: 'local', name: 'play' } : []);
  });
  const caller = routers.command.createCaller({ session, prisma: { account } });
  const listed = await caller.getCommands({ guildId: 'guild' });
  assert.deepEqual(Array.from(listed.commands, c => c.id), ['local']);
  await caller.getCommandAndGuildChannels({ guildId: 'guild', commandId: 'local' });
  assert.ok(calls.some(url => url.endsWith('/guilds/guild/commands/local')));
  assert.ok(!calls.some(url => url.endsWith('/applications/app/commands/local')));
});

test('Discord status and network failures never succeed', async () => {
  for (const [status, code] of [[401, 'UNAUTHORIZED'], [403, 'FORBIDDEN'], [429, 'TOO_MANY_REQUESTS']]) {
    const routers = fixture(async url => url.endsWith('/commands') ? response(200, url.includes('/guilds/') ? [] : [{ id: 'one', type: 1, name: 'play' }]) :
      response(status, { message: 'Discord error' }));
    const prisma = { account };
    await assert.rejects(routers.command.createCaller({ session, prisma }).getCommandPermissions({ guildId: 'guild', commandId: 'one' }), { code });
  }
  const missing = fixture(async url => url.endsWith('/commands') ? response(200, url.includes('/guilds/') ? [] : [{ id: 'one', type: 1, name: 'play' }]) :
    response(404, { message: 'Missing command' }));
  await assert.rejects(missing.command.createCaller({ session, prisma: { account } })
    .getCommandAndGuildChannels({ guildId: 'guild', commandId: 'one' }), { code: 'NOT_FOUND' });
  const routers = fixture(async () => { throw Error('offline'); }, null);
  await assert.rejects(routers.guild.createCaller({ session, prisma: { account, guild: { findMany: async () => [] } } }).getAll(),
    error => /could not be reached/.test(error.message));
});

test('permission edits retain user and channel overwrites and reject Discord failure', async () => {
  let sent;
  const routers = fixture(async (url, init) => {
    if (url.endsWith('/commands')) return response(200, url.includes('/guilds/') ? [] : [{ id: 'one', type: 1, name: 'play' }]);
    if (init.method === 'PUT') { sent = JSON.parse(init.body); return response(429, { message: 'Rate limited' }); }
    return response(200, { permissions: [
      { id: 'user', type: 2, permission: false }, { id: 'channel', type: 3, permission: true },
      { id: 'old-role', type: 1, permission: false }
    ] });
  });
  const caller = routers.command.createCaller({ session, prisma: { account } });
  await assert.rejects(caller.editCommandPermissions({ guildId: 'guild', commandId: 'one', type: 'allow',
    permissions: [{ id: 'new-role', type: 1, permission: false }] }), { code: 'TOO_MANY_REQUESTS' });
  assert.deepEqual(Array.from(sent.permissions, p => p.id), ['guild', 'new-role', 'user', 'channel']);
});

test('a registered command with no permission overrides remains editable', async () => {
  const routers = fixture(async url => url.endsWith('/commands') ? response(200, url.includes('/guilds/') ? [] : [{ id: 'one', type: 1, name: 'play' }]) :
    response(404, { code: 10066, message: 'Unknown application command permissions' }));
  const caller = routers.command.createCaller({ session, prisma: { account } });
  const result = await caller.getCommandPermissions({ guildId: 'guild', commandId: 'one' });
  assert.deepEqual(Array.from(result.command.permissions), []);
  await assert.rejects(caller.getCommandPermissions({ guildId: 'guild', commandId: 'missing' }), { code: 'NOT_FOUND' });
  const unrelated = fixture(async url => url.endsWith('/commands') ? response(200, url.includes('/guilds/') ? [] : [{ id: 'one', type: 1, name: 'play' }]) :
    response(404, { code: 10063, message: 'Unknown application command' }));
  await assert.rejects(unrelated.command.createCaller({ session, prisma: { account } })
    .getCommandPermissions({ guildId: 'guild', commandId: 'one' }), { code: 'NOT_FOUND' });
});

test('hub deletion waits for Discord and database, and retains state on failure', async () => {
  let finish;
  const routers = fixture(async (url, init) => {
    if (init.method === 'DELETE' && url.endsWith('/voice')) await new Promise(resolve => { finish = resolve; });
    return response(204);
  });
  const store = settingsFixture({ hub: 'category', hubChannel: 'voice' });
  const { prisma } = store;
  const pending = routers.hub.createCaller({ session, prisma }).delete({ guildId: 'guild' });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(store.activity.length, 0);
  finish();
  await pending;
  assert.deepEqual(store.activity[0], {
    guildId: 'guild', actorDiscordId: 'discord-user', kind: 'VOICE_HUB',
    before: { hub: 'category', hubChannel: 'voice' }, after: { hub: null, hubChannel: null }
  });
  assert.deepEqual(store.settings(), { hub: null, hubChannel: null });
  await routers.hub.createCaller({ session, prisma }).delete({ guildId: 'guild' });
  const failing = fixture(async () => response(403, { message: 'Denied' }));
  const blocked = settingsFixture({ hub: 'category', hubChannel: 'voice' });
  await assert.rejects(failing.hub.createCaller({ session, prisma: blocked.prisma }).delete({ guildId: 'guild' }), { code: 'FORBIDDEN' });
  assert.equal(store.activity.length, 1);
  assert.equal(blocked.activity.length, 0);
});

test('hub creation records the created channel IDs only with committed settings', async () => {
  const removed = [];
  const routers = fixture(async (url, init) => {
    if (init.method === 'DELETE') {
      removed.push(url.split('/').pop());
      return response(204);
    }
    return response(200, { id: JSON.parse(init.body).type === 4 ? 'category' : 'voice' });
  });
  const store = settingsFixture({ hub: null, hubChannel: null });
  const create = () => routers.hub.createCaller({ session, prisma: store.prisma })
    .create({ guildId: 'guild', name: 'Voice hub' });
  store.failures.push('P2021');
  await assert.rejects(create(), /Fixture rollback/);
  assert.deepEqual(removed, ['voice', 'category']);
  assert.equal(store.activity.length, 0);
  await create();
  assert.equal(store.activity.length, 1);
  assert.deepEqual(store.activity[0].after, { hub: 'category', hubChannel: 'voice' });
});

test('hub creation rejects duplicates and rolls back a partial Discord create', async () => {
  let posts = 0, deletes = 0;
  const routers = fixture(async (url, init) => {
    if (init.method === 'DELETE') { deletes++; return response(204); }
    if (++posts === 1) return response(200, { id: 'category' });
    return response(403, { message: 'Cannot create voice channel' });
  });
  const prisma = { account, guild: { findUnique: async () => ({ hub: null, hubChannel: null }), update: async () => { throw Error('Must not write'); } } };
  await assert.rejects(routers.hub.createCaller({ session, prisma }).create({ guildId: 'guild', name: 'Join To Create' }), { code: 'FORBIDDEN' });
  assert.equal(deletes, 1);
  const duplicate = { account, guild: { findUnique: async () => ({ hub: 'category', hubChannel: 'voice' }) } };
  await assert.rejects(routers.hub.createCaller({ session, prisma: duplicate }).create({ guildId: 'guild', name: 'Join To Create' }), { code: 'CONFLICT' });
  assert.equal(posts, 2);
});
