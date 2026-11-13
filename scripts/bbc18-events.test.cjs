// Focused offline BBC-18 fixtures. No app entrypoint, env, network or real topic files.
// Run: node --test scripts/bbc18-events.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const discord = require('discord.js');
const { initTRPC } = require('@trpc/server');
const { performance } = require('node:perf_hooks');
const root = path.resolve(__dirname, '..');
const ID = '123456789012345678';
const NOW = 1762695426597;
const settle = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function clock() {
  const timers = [];
  return {
    now: NOW, timers,
    setTimeout(fn, ms) { const timer = { fn, ms }; timers.push(timer); return timer; },
    setInterval(fn, ms) { this.interval = fn; this.intervalMs = ms; return { fn, ms }; },
    fire() { const timer = timers.shift(); assert.ok(timer, 'expected pending timer'); return timer.fn(); },
  };
}
function api(values = {}) {
  const calls = [];
  const trpc = new Proxy({}, { get: (_, router) => new Proxy({}, { get: (_, method) => {
    const route = `${router}.${method}`;
    const invoke = async input => {
      calls.push({ route, input });
      if (!(route in values)) throw Error('Unexpected API route ' + route);
      return typeof values[route] === 'function' ? values[route](input) : values[route];
    };
    return { query: invoke, mutate: invoke };
  } }) });
  return { trpc, calls, values, count: route => calls.filter(c => c.route === route).length };
}
function load(file, { trpc = {}, client = {}, timer = clock(), dependencies = {} } = {}) {
  const exports = {}, errors = [];
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true },
  }).outputText;
  const deps = {
    '@sapphire/decorators': { ApplyOptions: () => x => x },
    '@sapphire/framework': { Listener: class {}, container: { client } },
    'discord.js': discord,
    '../trpc': { trpcNode: trpc },
    path,
    '../lib/lifecycle': {
      setTimeout: timer.setTimeout.bind(timer), setInterval: timer.setInterval.bind(timer),
      clearTimeout() {}, clearInterval() {}, isStopping: () => false, trackWork: p => p,
    },
    '../lib/topicState': { topicFile: () => '/synthetic/topics.txt' },
    // Every topic operation is synthetic, and unexpected file operations fail closed.
    fs: new Proxy({}, { get: (_, key) => () => { throw Error('Real topic file access forbidden: ' + key); } }),
    ...dependencies,
  };
  class FakeDate extends Date { static now() { return timer.now; } }
  vm.runInNewContext(source, {
    exports, Date: FakeDate, setTimeout: timer.setTimeout.bind(timer), setInterval: timer.setInterval.bind(timer),
    __dirname: path.dirname(path.join(root, file)), process: { env: { GUILD_ID: 'guild', GIVEAWAY_CHANNEL_ID: 'giveaway', GENERAL_CHANNEL_ID: 'general' } },
    console: { log() {}, error(...args) { errors.push(args); } },
    require(id) { if (id === '../lib/giveawayLocation') return load('packages/bot/src/lib/giveawayLocation.ts', { trpc, client, timer, dependencies }); if (id === '../lib/giveawayCompletion') return load('packages/bot/src/lib/giveawayCompletion.ts', { trpc, client, timer, dependencies }); if (id in deps) return deps[id]; throw Error('Offline fixture forbids import: ' + id); },
  }, { filename: file });
  return { ...exports, errors, timer };
}
const settings = {
  startingCash: '15000', minCashPerChat: '10', maxCashPerChat: '20', interval: '60', roleIdInmate: 'inmate',
};
function messageFixture(options = {}) {
  const timer = clock(), sent = [], forwarded = [];
  const a = api({
    'setting.getByKeys': () => Object.entries(settings).map(([settingKey, settingValue]) => ({ settingKey, settingValue })),
    'user.claimMessageReward': () => ({ status: 'awarded', amount: 10 }),
    ...options.api,
  });
  const client = { channels: { cache: new Map([['735804432985620521', { send: async payload => { forwarded.push(payload); } }]]) } };
  const loaded = load('packages/bot/src/listeners/messageCreate.ts', { trpc: a.trpc, client, timer });
  const message = {
    id: ID, guild: { id: 'guild' }, author: { bot: false, id: 'user', username: 'User', displayAvatarURL: () => 'https://example.invalid/avatar.png' },
    member: { roles: { cache: new Map() }, permissions: new discord.PermissionsBitField(), displayHexColor: '#123456' },
    channel: { id: options.channel || 'normal', name: 'fixture', send: async payload => { sent.push(payload); return { delete: async () => { sent.push('notice-deleted'); } }; } },
    content: options.content || '', attachments: new Map(), embeds: [], createdAt: new Date(NOW),
    delete: async () => { sent.push('original-deleted'); },
  };
  return { ...loaded, a, client, message, sent, forwarded, listener: new loaded.MessageListener() };
}

test('settings batch reads only requested keys in one Prisma read; rejects unbounded input', async () => {
  const t = initTRPC.create();
  const { settingRouter } = load('packages/api/src/routers/setting.ts', { dependencies: { '../trpc': { t }, zod: require('zod') } });
  let calls = 0;
  const caller = settingRouter.createCaller({ prisma: { setting: { findMany: async args => {
    calls++;
    assert.deepEqual(Array.from(args.where.settingKey.in), ['interval', 'roleIdInmate']);
    assert.equal(JSON.stringify(args.select), JSON.stringify({ settingKey: true, settingValue: true }));
    return [{ settingKey: 'interval', settingValue: '60' }];
  } } } });
  assert.equal((await caller.getByKeys({ keys: ['interval', 'roleIdInmate'] }))[0].settingValue, '60');
  await assert.rejects(caller.getByKeys({ keys: [] }));
  await assert.rejects(caller.getByKeys({ keys: Array(6).fill('interval') }));
  assert.equal(calls, 1);
});

test('bot/DM/excluded messages do zero settings/economy reads, while excluded linger still responds', async () => {
  for (const kind of ['bot', 'dm', 'excluded']) {
    const f = messageFixture({ content: "I'm lingering!", channel: kind === 'excluded' ? '682838969179832423' : 'normal' });
    if (kind === 'bot') f.message.author.bot = true;
    if (kind === 'dm') f.message.guild = null;
    await f.listener.run(f.message);
    assert.equal(f.a.calls.length, 0);
    assert.equal(f.sent.length, kind === 'excluded' ? 1 : 0);
  }
});

test('the listener checks fresh settings and excludes inmates before requesting an atomic reward', async () => {
  const f = messageFixture();
  await f.listener.run(f.message);
  assert.equal(f.a.count('setting.getByKeys'), 1);
  assert.equal(f.a.calls[0].input.keys.length, 5);
  assert.deepEqual(JSON.parse(JSON.stringify(f.a.calls.find(c => c.route === 'user.claimMessageReward').input)),
    { messageId: ID, userId: 'user', name: 'User' });
  f.message.member.roles.cache.set('inmate', {});
  await f.listener.run(f.message);
  assert.equal(f.a.count('user.claimMessageReward'), 1);
  f.message.member.roles.cache.clear();
  f.a.values['setting.getByKeys'] = [];
  await f.listener.run(f.message);
  assert.equal(f.a.count('user.claimMessageReward'), 1);
});

test('overlapping messages wait for the previous claim and release the queue on failure', async () => {
  const gate = deferred();
  const f = messageFixture({ api: { 'user.claimMessageReward': () => gate.promise } });
  const first = f.listener.run(f.message); await settle();
  const second = f.listener.run({ ...f.message, id: '223456789012345678' }); await settle();
  assert.equal(f.a.count('user.claimMessageReward'), 1);
  f.a.values['user.claimMessageReward'] = () => ({ status: 'awarded', amount: 10 });
  gate.reject(Error('claim unavailable'));
  await Promise.all([first, second]);
  assert.equal(f.a.count('user.claimMessageReward'), 2);
  assert.equal(f.listener.awarding.size, 0);
});

test('settings or reward failures are contained and linger continues', async () => {
  for (const route of ['setting.getByKeys', 'user.claimMessageReward']) {
    const f = messageFixture({ content: "I'm lingering!", api: { [route]: () => { throw Error('dependency failed'); } } });
    await f.listener.run(f.message);
    assert.equal(f.errors.length, 1, route);
    assert.equal(f.sent.length, 1, route);
    assert.equal(f.a.count(route), 1);
  }
});

test('voice hub deletes the losing channel and keeps a registration whose response was lost', async () => {
  const { VoiceStateUpdateListener } = load('packages/bot/src/listeners/tempchannels/voiceStateUpdate.ts', {
    dependencies: { '../../trpc': { trpcNode: voiceApi() } },
  });
  let registered, nextChannel = 0, loseResponse = true;
  const deleted = [], moved = [];
  function voiceApi() {
    return api({
      'guild.getGuild': { guild: { hub: 'category', hubChannel: 'hub' } },
      'hub.getTempChannel': async () => ({ tempChannel: registered }),
      'hub.createTempChannel': ({ channelId }) => {
        registered ??= { id: channelId };
        if (loseResponse) {
          loseResponse = false;
          throw new Error('response lost');
        }
        return { tempChannel: registered };
      },
    }).trpc;
  }
  const state = {
    guild: { id: 'guild', channels: { create: async () => {
      const id = String(++nextChannel);
      return { id, delete: async () => { deleted.push(id); } };
    } } },
    channelId: 'hub',
    member: { id: 'owner', user: { username: 'Owner' }, voice: { setChannel: async id => { moved.push(id); } } },
  };
  const listener = new VoiceStateUpdateListener();
  await Promise.all([listener.run({}, state), listener.run({}, state)]);
  assert.equal(nextChannel, 2);
  assert.deepEqual(deleted, ['2']);
  assert.deepEqual(moved, ['1', '1']);
});

test('media-only moderation uses actual v14 embeds/permissions and survives settings outage', async () => {
  const f = messageFixture({ channel: '669514957938753558', content: '@everyone hello @here', api: { 'setting.getByKeys': () => { throw Error('API down'); } } });
  f.message.reference = { messageId: ID };
  await f.listener.run(f.message);
  assert.equal(f.sent[0], 'original-deleted');
  assert.equal(f.forwarded[0], '<@user>');
  const embed = f.forwarded[1].embeds[0].toJSON();
  assert.equal(embed.author.name, 'User');
  assert.equal(embed.fields[0].value, '@\u200beveryone hello @\u200bhere');
  assert.ok(embed.fields[1].value.includes(ID));
  assert.equal(embed.footer.text, '#fixture');
  assert.equal(f.timer.timers[0].ms, 5000);
  f.timer.fire(); await settle();
  assert.ok(f.sent.includes('notice-deleted'));
});

test('media admin/attachment/embed exemptions persist; moderation and linger send failures are caught', async () => {
  for (const kind of ['admin', 'attachment', 'embed']) {
    const f = messageFixture({ channel: '669514957938753558', content: "I'm lingering!" });
    if (kind === 'admin') f.message.member.permissions.add(discord.PermissionFlagsBits.Administrator);
    if (kind === 'attachment') f.message.attachments.set('id', {});
    if (kind === 'embed') f.message.embeds.push({});
    await f.listener.run(f.message);
    assert.equal(f.forwarded.length, 0);
    assert.equal(f.sent.length, 1);
  }
  const f = messageFixture({ channel: '669514957938753558', content: "I'm lingering!" });
  f.message.delete = async () => { throw Error('delete denied'); };
  f.message.channel.send = async () => { throw Error('send denied'); };
  await f.listener.run(f.message);
  assert.equal(f.errors.length, 2);
});

test('media forwarding preserves long/empty content; missing destination preserves the original', async () => {
  for (const content of ['x'.repeat(2000), '']) {
    const f = messageFixture({ channel: '669514957938753558', content });
    await f.listener.run(f.message);
    const embed = f.forwarded[1].embeds[0].toJSON();
    assert.equal(embed.fields.map(field => field.value).join(''), content || '(empty message)');
    assert.ok(embed.fields.every(field => field.value.length <= 1024));
  }
  const f = messageFixture({ channel: '669514957938753558' });
  f.client.channels.cache.clear();
  await f.listener.run(f.message);
  assert.equal(f.sent.length, 0);
  assert.equal(f.errors.length, 1);
});

function interactionFixture() {
  const a = api({
    'giveaway.getById': { prize: 'Prize', numOfEntries: 2, entryFee: '10' },
    'giveaway.getEntries': [], 'giveaway.getParticipants': [],
    'user.getUserById': { user: { cash: 100 } }, 'user.subtractCash': {}, 'giveaway.addEntry': { status: 'joined' },
  });
  const responses = [], pages = [];
  class Pagination {
    setTitleField() { return this; } setTemplate() { return this; } setItems(items) { pages.push(items); return this; }
    setItemsPerPage() { return this; } make() { return this; } async run() { if (this.constructor.gate) await this.constructor.gate; }
  }
  const loaded = load('packages/bot/src/listeners/interactionCreate.ts', { trpc: a.trpc, dependencies: { '@sapphire/discord.js-utilities': { PaginatedFieldMessageEmbed: Pagination } } });
  const interaction = { isButton: () => true, inGuild: () => true, customId: `${ID}-Join`, user: { id: 'user' }, guild: { iconURL: () => null },
    deferReply: async () => {}, editReply: async value => { responses.push(value); },
    reply: async value => { responses.push(value); }, followUp: async value => { responses.push(value); } };
  return { ...loaded, a, responses, pages, Pagination, interaction, listener: new loaded.InteractionCreateListener() };
}

test('slash/autocomplete/select and unrelated/malformed/non-guild buttons never query giveaways', async () => {
  const f = interactionFixture();
  for (const isButton of [false]) await f.listener.run({ isButton: () => isButton });
  for (const customId of [undefined, '', 'music-pause', '123-Join', `${ID}-Unknown`, `${ID}-Join-extra`, `abc-Participants`]) {
    await f.listener.run({ ...f.interaction, customId });
  }
  await f.listener.run({ ...f.interaction, inGuild: () => false });
  assert.equal(f.a.calls.length, 0);
});

test('giveaway Join uses atomic entry outcomes without separate balance/entry reads', async () => {
  const f = interactionFixture();
  for (const [status, text] of [['joined', 'joined'], ['cap', 'maximum'], ['funds', 'enough money'], ['ended', 'ended'], ['missing', 'not found']]) {
    f.a.values['giveaway.addEntry'] = { status };
    await f.listener.run(f.interaction);
    assert.ok(f.responses.at(-1).content.includes(text));
  }
  assert.equal(f.a.count('giveaway.addEntry'), 5);
  assert.equal(f.a.calls.length, 5);
});

test('participant pagination is awaited; lookup/render/reply errors are contained', async () => {
  const f = interactionFixture(), gate = deferred();
  f.Pagination.gate = gate.promise;
  const running = f.listener.run({ ...f.interaction, customId: `${ID}-Participants` });
  let done = false; running.then(() => { done = true; }); await settle();
  assert.equal(done, false);
  assert.equal(f.pages[0][0], 'No one has joined the giveaway yet. :(');
  gate.reject(Error('pagination failed')); await running;
  assert.equal(f.errors.length, 1);
  f.a.values['giveaway.getById'] = () => { throw Error('API down'); };
  await f.listener.run({ ...f.interaction, customId: `${ID}-Participants`, replied: true });
  await f.listener.run({ ...f.interaction, customId: `${ID}-Participants`, reply: async () => { throw Error('expired'); } });
  assert.equal(f.errors.length, 4);
});

function presenceFixture() {
  const timer = clock();
  let scans = 0, renames = 0, fetches = 0;
  const members = new discord.Collection([
    ['human-online', { user: { bot: false }, presence: { status: 'online' } }],
    ['bot-online', { user: { bot: true }, presence: { status: 'online' } }],
    ['bot-idle', { user: { bot: true }, presence: { status: 'idle' } }],
    ['human-dnd', { user: { bot: false }, presence: { status: 'dnd' } }],
    ['offline', { user: { bot: false } }],
  ]);
  const filter = members.filter.bind(members);
  members.filter = (...args) => { scans++; return filter(...args); };
  const channel = { name: 'Online: 0', setName: async name => { renames++; channel.name = name; } };
  const guild = { members: { cache: members }, channels: { cache: new Map([['1190145789591310386', channel]]) } };
  const client = { guilds: { fetch: async () => { fetches++; return guild; } } };
  const loaded = load('packages/bot/src/listeners/presenceUpdate.ts', { client, timer });
  const listener = new loaded.PresenceUpdateListener();
  const event = () => listener.run(null, { guild: { id: 'guild' } });
  return { ...loaded, listener, event, channel, members, client, counts: () => ({ scans, renames, fetches }) };
}

test('100 presence events coalesce into one recount/rename; legacy bot semantics and unchanged skip persist', async () => {
  const f = presenceFixture();
  for (let i = 5; i < 1200; i++) f.members.set('offline' + i, { user: { bot: false } });
  assert.equal(f.members.size, 1200);
  f.listener.run(null, { guild: { id: 'other' } });
  assert.equal(f.timer.timers.length, 0);
  for (let i = 0; i < 100; i++) f.event();
  assert.equal(f.timer.timers.length, 1);
  assert.equal(f.timer.timers[0].ms, 5000);
  await f.timer.fire();
  assert.equal(f.channel.name, 'Online: 3');
  assert.deepEqual(f.counts(), { scans: 1, renames: 1, fetches: 1 });
  for (let i = 0; i < 100; i++) f.event();
  await f.timer.fire();
  assert.deepEqual(f.counts(), { scans: 2, renames: 1, fetches: 2 });
});

test('slow presence rename permits one pending window and eventual fresh count, without overlap', async () => {
  const f = presenceFixture(), gate = deferred();
  f.channel.setName = async name => { await gate.promise; f.channel.name = name; };
  f.event(); const first = f.timer.fire(); await settle();
  f.members.set('new', { user: { bot: false }, presence: { status: 'online' } });
  for (let i = 0; i < 100; i++) f.event();
  assert.equal(f.timer.timers.length, 0);
  assert.equal(f.counts().scans, 1);
  gate.resolve(); await first;
  assert.equal(f.timer.timers.length, 1);
  await f.timer.fire();
  assert.equal(f.channel.name, 'Online: 4');
  assert.equal(f.counts().scans, 2);
  assert.equal(f.timer.timers.length, 0);
});

test('failed presence fetch/rename is handled and retries in a bounded window', async () => {
  for (const stage of ['fetch', 'rename']) {
    const f = presenceFixture();
    const target = stage === 'fetch' ? f.client.guilds : f.channel;
    const method = stage === 'fetch' ? 'fetch' : 'setName';
    const original = target[method];
    target[method] = async () => { throw Error('dependency failed'); };
    f.event(); await f.timer.fire();
    assert.equal(f.errors.length, 1);
    assert.equal(f.timer.timers.length, 1);
    target[method] = original;
    await f.timer.fire();
    assert.equal(f.channel.name, 'Online: 3');
    assert.equal(f.timer.timers.length, 0);
  }
});

async function schedulerFixture({ inmates = 0, giveaways = [], api: overrides = {}, topic = 'not-due' } = {}) {
  const timer = clock(), effects = [], removed = [], messages = new Map(), listeners = new Map();
  const members = new discord.Collection(Array.from({ length: inmates }, (_, i) => [`inmate${i}`, { id: `inmate${i}`, roles: { remove: async () => { removed.push(`inmate${i}`); } } }]));
  const role = { id: 'inmate', members };
  const guild = { id: 'guild', members: { cache: members, fetch: async () => {} }, roles: { cache: new discord.Collection([['inmate', role]]), fetch: async () => {} } };
  for (const id of giveaways) {
    const message = { content: 'Giveaway', components: [], author: { id: 'bot' }, embeds: [{ title: 'Giveaway', color: 0x123456 }], attachments: new discord.Collection(), url: 'https://example.invalid/message' };
    message.edit = async payload => {
      effects.push('edit:' + id);
      if (payload.embeds) message.embeds = payload.embeds.map(e => e.toJSON());
      if (payload.components) message.components = payload.components.map(row => new discord.ActionRow(row.toJSON()));
      if (payload.content) message.content = payload.content;
      return message;
    };
    messages.set(id, message);
  }
  const channel = { id: 'giveaway', guildId: 'guild', type: discord.ChannelType.GuildText, messages: { fetch: async input => { effects.push('fetch:' + input.message); return messages.get(input.message); } },
    send: async () => { effects.push('announce'); return { id: '323456789012345678' }; } };
  const client = { user: { username: 'Fixture', id: 'bot' }, intervals: {}, activeGiveaways: new Map(),
    on(event, listener) { listeners.set(event, listener); }, guilds: { fetch: async () => guild },
    channels: { cache: new Map([['giveaway', channel], ['general', { send: async () => { effects.push('topic'); } }]]) } };
  const a = api({
    'setting.getByKey': 'inmate', 'giveaway.getActive': giveaways.map(giveawayId => ({ giveawayId, endsAt: String(NOW - 1) })),
    'user.getUserById': { user: { lastHeistDate: '0', jailTime: 1 } },
    'giveaway.getById': ({ giveawayId }) => ({ giveawayId, endsAt: String(timer.now - 1), messageId: giveawayId, numOfWinners: 1, hostId: '', prize: 'Prize', guildId: 'guild', channelId: 'giveaway' }),
    'giveaway.getCompletionEntries': [{ userId: 'winner' }], 'giveaway.getParticipants': [{ userId: 'winner' }],
    'giveaway.endGiveaway': ({ giveawayId }) => { effects.push('end:' + giveawayId); }, ...overrides,
  });
  const fakeFs = topic === 'not-due' ? undefined : {
    existsSync: () => topic !== 'empty', readFileSync: () => 'Synthetic topic',
    writeFileSync: () => {}, renameSync: () => {},
  };
  const loaded = load('packages/bot/src/listeners/ready.ts', { client, timer, trpc: a.trpc, dependencies: fakeFs ? { fs: fakeFs } : {} });
  await new loaded.ReadyListener().run(client);
  if (topic !== 'not-due') timer.now = 1789723417000 + 180 * 60 * 1000;
  return { ...loaded, a, client, guild, role, channel, effects, removed, messages, listeners, tick: () => timer.interval() };
}

test('scheduler skips overlapping ticks and awaits inmate role removal before completing', async () => {
  const gate = deferred();
  const f = await schedulerFixture({ inmates: 1 });
  f.guild.members.cache.get('inmate0').roles.remove = () => gate.promise;
  let done = false;
  const first = f.tick(); first.then(() => { done = true; }); await settle();
  f.timer.now += 1000; await f.tick();
  f.timer.now += 1000; await f.tick();
  assert.equal(done, false);
  assert.equal(f.a.count('user.getUserById'), 1);
  gate.reject(Error('Discord denied')); await first;
  assert.equal(f.errors.length, 1);
  f.guild.members.cache.get('inmate0').roles.remove = async () => {};
  await f.tick();
  assert.equal(f.a.count('user.getUserById'), 1, 'failed removal waits before retrying');
  f.timer.now += 30000;
  await f.tick();
  assert.equal(f.a.count('user.getUserById'), 2, 'guard resets in finally');
});

test('delayed 5-inmate/5-giveaway fixture bounds lookup concurrency and returns only after all work', async () => {
  const gate = deferred(); let lookups = 0, active = 0, peak = 0;
  const delayed = async value => { lookups++; active++; peak = Math.max(peak, active); await gate.promise; active--; return value; };
  const f = await schedulerFixture({ inmates: 5, giveaways: ['g0','g1','g2','g3','g4'], api: {
    'user.getUserById': () => delayed({ user: { lastHeistDate: String(NOW), jailTime: 999999 } }),
    'giveaway.getById': () => delayed({ endsAt: '9999999999999' }),
  } });
  const first = f.tick(); await settle();
  f.timer.now += 1000; await f.tick(); f.timer.now += 1000; await f.tick();
  assert.equal(lookups, 1); assert.equal(peak, 1); assert.equal(active, 1);
  gate.resolve(); await first;
  assert.equal(lookups, 10); assert.equal(active, 0); assert.equal(peak, 1);
});

test('giveaway fetch/edit/announcement/completion are awaited in order; active list removal cannot skip next ID', async () => {
  const f = await schedulerFixture({ giveaways: ['g1','g2'] }), gate = deferred();
  f.channel.send = async () => { f.effects.push('announce'); await gate.promise; return { id: '323456789012345678' }; };
  const first = f.tick(); await settle();
  await f.tick();
  assert.deepEqual(f.effects, ['fetch:g1', 'edit:g1', 'edit:g1', 'announce']);
  assert.equal(f.a.count('giveaway.endGiveaway'), 0);
  assert.equal(f.a.count('giveaway.getById'), 1);
  gate.resolve(); await first;
  assert.deepEqual(f.effects, ['fetch:g1', 'edit:g1', 'edit:g1', 'announce', 'edit:g1', 'end:g1', 'fetch:g2', 'edit:g2', 'edit:g2', 'announce', 'edit:g2', 'end:g2']);
  assert.equal(f.client.activeGiveaways.size, 0);
});

test('future giveaways and jail terms do no recurring reads and recheck stored deadlines when due', async () => {
  const f = await schedulerFixture({ inmates: 1, giveaways: ['g1'], api: {
    'giveaway.getActive': [{ giveawayId: 'g1', endsAt: String(NOW + 10000) }],
    'user.getUserById': { user: { lastHeistDate: String(NOW), jailTime: 10 } },
  } });
  for (let second = 1; second <= 9; second++) {
    f.timer.now = NOW + second * 1000;
    await f.tick();
  }
  assert.equal(f.a.count('user.getUserById'), 1);
  assert.equal(f.a.count('giveaway.getById'), 0);

  f.timer.now = NOW + 10000;
  await f.tick();
  assert.equal(f.a.count('giveaway.getById'), 1);
  assert.ok(f.effects.includes('end:g1'));
  assert.deepEqual(f.removed, [], 'inmate is still jailed at the exact deadline');

  f.a.values['user.getUserById'] = { user: { lastHeistDate: String(NOW), jailTime: 20 } };
  f.timer.now = NOW + 11000;
  await f.tick();
  assert.equal(f.a.count('user.getUserById'), 2);
  assert.deepEqual(f.removed, [], 'the stored extension is respected');
  f.timer.now = NOW + 21000;
  await f.tick();
  assert.equal(f.a.count('user.getUserById'), 3);
  assert.deepEqual(f.removed, ['inmate0']);
});

test('inmate role changes invalidate cached deadlines and prevent release from an in-flight stale read', async () => {
  const f = await schedulerFixture({ inmates: 1 });
  const pending = deferred();
  f.a.values['user.getUserById'] = () => pending.promise;
  const first = f.tick();
  await settle();
  const update = f.listeners.get('guildMemberUpdate');
  const unjailed = { id: 'inmate0', guild: f.guild, roles: { cache: new Map() } };
  const jailed = { id: 'inmate0', guild: f.guild, roles: { cache: new Map([['inmate', {}]]) } };
  update(jailed, unjailed);
  update(unjailed, jailed);
  pending.resolve({ user: { lastHeistDate: '0', jailTime: 1 } });
  await first;
  assert.deepEqual(f.removed, []);
  f.a.values['user.getUserById'] = { user: { lastHeistDate: String(NOW), jailTime: 30 } };
  await f.tick();
  await f.tick();
  assert.equal(f.a.count('user.getUserById'), 2);
  assert.deepEqual(f.removed, []);
});

test('scheduler lookup/Discord/completion failures are isolated and failed giveaways remain active', async () => {
  for (const stage of ['lookup', 'fetch', 'edit', 'announce', 'end']) {
    const f = await schedulerFixture({ inmates: 2, giveaways: ['g1', 'g2'] });
    f.a.values['user.getUserById'] = ({ id }) => { if (id === 'inmate0') throw Error('API down'); return { user: { lastHeistDate: '0', jailTime: 1 } }; };
    if (stage === 'lookup') {
      const original = f.a.values['giveaway.getById'];
      f.a.values['giveaway.getById'] = input => { if (input.giveawayId === 'g1') throw Error('down'); return original(input); };
    }
    if (stage === 'fetch') {
      const original = f.channel.messages.fetch;
      f.channel.messages.fetch = id => { if (id.message === 'g1') throw Error('down'); return original(id); };
    }
    if (stage === 'edit') f.messages.get('g1').edit = async () => { throw Error('down'); };
    if (stage === 'announce') { let first = true; f.channel.send = async () => { if (first) { first = false; throw Error('down'); } return { id: '323456789012345678' }; }; }
    if (stage === 'end') { const original = f.a.values['giveaway.endGiveaway']; f.a.values['giveaway.endGiveaway'] = input => { if (input.giveawayId === 'g1') throw Error('down'); return original(input); }; }
    await f.tick();
    assert.deepEqual(f.removed, ['inmate1'], stage);
    assert.deepEqual(Array.from(f.client.activeGiveaways.keys()), ['g1'], stage);
    assert.ok(f.effects.includes('end:g2'), stage);
    assert.equal(f.errors.length, 2, stage);
  }
});

test('topic send is awaited; empty/failed topic does not abort giveaways; idle scheduler makes no poll reads', async () => {
  const idle = await schedulerFixture(); await idle.tick();
  assert.equal(idle.a.count('user.getUserById') + idle.a.count('giveaway.getById'), 0);
  for (const topic of ['empty', 'send', 'failure']) {
    const f = await schedulerFixture({ giveaways: ['g1'], topic });
    const gate = deferred();
    f.client.channels.cache.get('general').send = async () => { if (topic === 'failure') throw Error('send denied'); await gate.promise; };
    const run = f.tick(); await settle();
    if (topic === 'send') {
      assert.equal(f.a.count('giveaway.getById'), 0);
      await f.tick();
      gate.resolve();
    }
    await run;
    assert.ok(f.effects.includes('end:g1'), topic);
  }
});

test('bounded message-only latency samples reuse BBC-16 cases/delays without rerunning its audit', async t => {
  const wait = ms => ms ? new Promise(resolve => setTimeout(resolve, ms)) : Promise.resolve();
  for (const delay of [0, 5]) for (const excluded of [true, false]) {
    const f = messageFixture({ channel: excluded ? '682838969179832423' : 'normal' });
    for (const route of ['setting.getByKeys', 'user.getUserById']) {
      const original = f.a.values[route];
      f.a.values[route] = async input => { await wait(delay); return original(input); };
    }
    await f.listener.run(f.message); // excluded warmup
    const samples = [];
    for (let i = 0; i < 7; i++) { const start = performance.now(); await f.listener.run(f.message); samples.push(performance.now() - start); }
    samples.sort((a, b) => a - b);
    assert.equal(f.a.calls.length / 8, excluded ? 0 : 2);
    t.diagnostic(JSON.stringify({ fixture: excluded ? 'no-cash' : 'cooldown', requestedDelayMs: delay, samples: 7, apiCallsPerRun: f.a.calls.length / 8, medianMs: +samples[3].toFixed(3), p95Ms: +samples[6].toFixed(3) }));
  }
});
