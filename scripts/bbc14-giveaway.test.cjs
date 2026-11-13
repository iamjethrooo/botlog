// Actual giveaway router, listener, command and completion code; offline boundaries.
// No env files, Prisma engine, application entrypoint or network is loaded.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const discord = require('discord.js');
const { initTRPC } = require('@trpc/server');
const t = initTRPC.create();
const ID = '123456789012345678', USER = '223456789012345678', ANN = '323456789012345678';
const NOW = 1800000000000;
const clone = value => structuredClone(value);
const base = { giveawayId: ID, messageId: ID, prize: 'Prize', entryFee: '10', maxEntriesPerUser: 2, guildId: 'guild', channelId: 'channel',
  numOfWinners: 2, hostId: '', endsAt: String(NOW + 1000), dateStarted: '0', ended: false };
function load(file, { api = {}, client = {}, clock = { now: NOW }, pagination, timer } = {}) {
  const exports = {}, errors = [];
  class FakeDate extends Date { static now() { return clock.now; } }
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true },
  }).outputText;
  const env = { api, client, clock, pagination, timer };
  vm.runInNewContext(source, { exports, Date: FakeDate,
    Math, process: { env: { GIVEAWAY_CHANNEL_ID: 'channel', GUILD_ID: 'guild' } },
    __dirname: path.join(__dirname, '..', path.dirname(file)),
    setInterval: fn => { if (!timer) throw Error('Unexpected timer'); timer.tick = fn; return fn; },
    console: { log() {}, error(...args) { errors.push(args); } },
    require(id) {
      if (id === '../trpc' && file.includes('/api/')) return { t };
      if (['../trpc', '../../trpc'].includes(id) && file.includes('/bot/')) return { trpcNode: api };
      if (id === '../economy') return load('packages/api/src/economy.ts', env);
      if (id === '../lib/giveawayCompletion') return load('packages/bot/src/lib/giveawayCompletion.ts', env);
      if (id === '../lib/giveawayLocation') return load('packages/bot/src/lib/giveawayLocation.ts', env);
      if (id === '../lib/topicState') return load('packages/bot/src/lib/topicState.ts', env);
      // Deterministic scheduler boundary; real lifecycle/topic behavior is covered by BBC-21.
      if (id === '../lib/lifecycle') return { setInterval: fn => {
        if (!timer) throw Error('Unexpected timer'); timer.tick = fn; return fn;
      } };
      if (['@trpc/server', 'zod'].includes(id)) return require(id);
      if (id === 'discord.js') return discord;
      if (id === '@sapphire/decorators') return { ApplyOptions: () => value => value };
      if (id === '@sapphire/framework') return { Command: class {}, Listener: class {}, container: { client } };
      if (id === '@sapphire/discord.js-utilities') return { PaginatedFieldMessageEmbed: pagination };
      if (id === 'path') return path;
      if (id === 'fs') return new Proxy({}, { get: () => () => { throw Error('Topic filesystem forbidden'); } });
      throw Error('Unlisted offline import: ' + id);
    },
  }, { filename: file });
  return { ...exports, errors };
}
function storage(overrides = {}, clock = { now: NOW }) {
  let state = { giveaway: [clone(base)], giveawayEntry: [], user: [{ discordId: USER, cash: 100 }], ...overrides };
  let version = 0, attempts = 0, fail, unknown, gate;
  const calls = [];
  const matches = (row, where = {}) => Object.entries(where).every(([key, value]) =>
    value && typeof value === 'object' ? row[key] >= value.gte : row[key] === value);
  function db(get, write) {
    return Object.fromEntries(['giveaway', 'giveawayEntry', 'user'].map(entity => [entity,
      Object.fromEntries(['findUnique', 'findMany', 'count', 'create', 'update', 'updateMany'].map(method => [method, async (args = {}) => {
        const route = `${entity}.${method}`; calls.push(route);
        if (gate?.route === route) { const g = gate; gate = null; await g.promise; }
        if (fail?.route === route && fail.remaining-- > 0) throw Object.assign(Error('Injected failure'), { code: fail.code });
        const rows = get()[entity], selected = rows.filter(row => matches(row, args.where));
        if (method === 'findUnique') return clone(selected[0] ?? null);
        if (method === 'findMany') return clone(args.distinct ? selected.filter((row, i) => selected.findIndex(r => r.userDiscordId === row.userDiscordId) === i) : selected);
        if (method === 'count') return selected.length;
        if (method === 'create') { const row = { id: rows.length + 1, ...clone(args.data) }; rows.push(row); write(); return clone(row); }
        if (method === 'update' && !selected.length) throw Error('Missing row');
        for (const row of selected) for (const [key, value] of Object.entries(args.data))
          row[key] = value && typeof value === 'object' && 'decrement' in value ? row[key] - value.decrement : value;
        if (selected.length) write();
        return method === 'updateMany' ? { count: selected.length } : clone(selected[0]);
      }]))]));
  }
  const prisma = db(() => state, () => version++);
  prisma.$transaction = async (operation, options) => {
    assert.equal(options.isolationLevel, 'Serializable'); attempts++;
    const before = version, snapshot = clone(state);
    const result = await operation(db(() => snapshot, () => {}));
    if (before !== version) throw Object.assign(Error('Conflict'), { code: 'P2034' });
    state = snapshot; version++;
    if (unknown) throw Error('Unknown commit outcome');
    return result;
  };
  const router = load('packages/api/src/routers/giveaway.ts', { clock }).giveawayRouter;
  const caller = router.createCaller({ prisma, session: null });
  const api = { giveaway: Object.fromEntries(Object.keys(router._def.procedures).map(name => [name,
    { mutate: input => caller[name](input), query: input => caller[name](input) }])) };
  return { caller, api, clock, calls, state: () => clone(state), attempts: () => attempts,
    fail: (route, code = 'FAIL', remaining = 1) => { fail = { route, code, remaining }; },
    unknown: () => { unknown = true; }, hold: (route, promise) => { gate = { route, promise }; } };
}
const enter = f => f.caller.addEntry({ giveawayId: ID, userId: USER });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const settle = async () => { for (let i = 0; i < 50; i++) await Promise.resolve(); };

test('delete preserves giveaways with entries and returns the existing delete count for empty giveaways', async () => {
  const { giveawayRouter } = load('packages/api/src/routers/giveaway.ts');
  const prisma = { giveaway: { deleteMany: async ({ where }) => {
    if (where.giveawayId === ID) throw Object.assign(Error('Foreign key violation'), { code: 'P2003' });
    return { count: 1 };
  } } };
  const caller = giveawayRouter.createCaller({ prisma, session: null });
  await assert.rejects(caller.delete({ giveawayId: ID }), {
    code: 'CONFLICT', message: 'A giveaway with entries cannot be deleted.',
  });
  assert.deepEqual(await caller.delete({ giveawayId: 'empty' }), { count: 1 });
});

test('concurrent entries respect per-user cap and charge exactly the inserted entries', async () => {
  const f = storage();
  const results = await Promise.all([enter(f), enter(f), enter(f)]);
  assert.deepEqual(results.map(r => r.status).sort(), ['cap', 'joined', 'joined']);
  assert.equal(f.state().user[0].cash, 80); assert.equal(f.state().giveawayEntry.length, 2);
});
test('competing paid entries cannot overspend; zero fee and missing users have defined outcomes', async () => {
  const f = storage({ user: [{ discordId: USER, cash: 10 }] });
  const results = await Promise.all([enter(f), enter(f)]);
  assert.deepEqual(results.map(r => r.status).sort(), ['funds', 'joined']);
  assert.equal(f.state().user[0].cash, 0); assert.equal(f.state().giveawayEntry.length, 1);
  const free = storage({ giveaway: [{ ...base, entryFee: '0' }], user: [{ discordId: USER, cash: 0 }] });
  assert.equal((await enter(free)).status, 'joined'); assert.equal(free.state().user[0].cash, 0);
  assert.equal((await enter(storage({ user: [] }))).status, 'funds');
});
test('failed debit or insert rolls back all database changes; known conflicts alone retry', async () => {
  for (const route of ['user.updateMany', 'giveawayEntry.create']) {
    const f = storage(), before = f.state(); f.fail(route);
    await assert.rejects(enter(f)); assert.deepEqual(f.state(), before); assert.equal(f.attempts(), 1);
  }
  const f = storage(); f.fail('giveawayEntry.create', 'P2034', 2);
  assert.equal((await enter(f)).status, 'joined'); assert.equal(f.attempts(), 3);
  assert.equal(f.state().user[0].cash, 90); assert.equal(f.state().giveawayEntry.length, 1);
  const exhausted = storage(); exhausted.fail('giveawayEntry.create', 'P2034', 4);
  await assert.rejects(enter(exhausted)); assert.equal(exhausted.attempts(), 3); assert.equal(exhausted.state().user[0].cash, 100);
  const unknown = storage(); unknown.unknown(); await assert.rejects(enter(unknown));
  assert.equal(unknown.attempts(), 1); assert.equal(unknown.state().giveawayEntry.length, 1);
});
test('missing/ended/expired and malformed legacy giveaways cannot charge', async () => {
  for (const giveaway of [[], [{ ...base, ended: true }], [{ ...base, endsAt: String(NOW) }]]) {
    const f = storage({ giveaway }), before = f.state();
    assert.ok(['missing', 'ended'].includes((await enter(f)).status)); assert.deepEqual(f.state(), before);
  }
  for (const changes of [{ entryFee: '-1' }, { entryFee: 'NaN' }, { entryFee: '' }, { entryFee: '1.2' }, { endsAt: 'NaN' }, { maxEntriesPerUser: 0 }]) {
    const f = storage({ giveaway: [{ ...base, ...changes }] }), before = f.state();
    await assert.rejects(enter(f)); assert.deepEqual(f.state(), before);
  }
});
test('deadline race excludes rolled-back late payment and completion snapshot is stable', async () => {
  const f = storage(), gate = deferred(); f.hold('user.updateMany', gate.promise);
  const entry = enter(f); await settle(); f.clock.now = NOW + 1001;
  const entries = await f.caller.getCompletionEntries({ giveawayId: ID });
  gate.resolve(); assert.equal((await entry).status, 'ended');
  assert.equal(entries.length, 0); assert.equal(f.state().user[0].cash, 100);
  await assert.rejects(storage().caller.getCompletionEntries({ giveawayId: ID }));
});
test('creation rejects invalid fees, counts and end times at the API boundary', async () => {
  for (const changes of [{ entryFee: '-1' }, { entryFee: 'Infinity' }, { maxEntriesPerUser: 0 }, { numOfWinners: 0 }, { numOfWinners: 101 }, { endsAt: 'bad' }, { endsAt: String(NOW) }, { prize: '' }]) {
    const f = storage(); await assert.rejects(f.caller.create({ ...base, ...changes }));
    assert.equal(f.calls.length, 0);
  }
});

function discordFixture(f = storage({ giveaway: [{ ...base, endsAt: String(NOW - 1) }],
  giveawayEntry: [{ giveawayId: ID, userDiscordId: USER }, { giveawayId: ID, userDiscordId: USER }, { giveawayId: ID, userDiscordId: '423456789012345678' }] })) {
  let data = { content: '🎉Giveaway🎉', embeds: [{ title: 'Prize', color: 0x123456 }], components: [], attachments: ['preserved'] };
  const history = new discord.Collection(), effects = [];
  const faults = {};
  const message = () => ({ ...clone(data), id: ID, url: 'https://example.invalid/giveaway', author: { id: 'bot' },
    components: data.components.map(row => new discord.ActionRow(row)),
    edit: async payload => {
      effects.push('edit'); const error = faults.edit; delete faults.edit;
      if (error && !error.after) throw error;
      const next = { ...payload };
      for (const key of ['embeds', 'components']) if (next[key]) next[key] = next[key].map(item => item.toJSON ? item.toJSON() : item);
      data = { ...data, ...clone(next) };
      if (error) throw error;
      return message();
    } });
  const channel = { messages: { fetch: async input => {
    if (input.limit) { effects.push('history'); if (faults.history) throw faults.history; return history; }
    assert.equal(input.force, true); effects.push('fetch'); if (faults.fetch) throw faults.fetch; return message();
  } }, send: async payload => {
    effects.push('send'); assert.equal(payload.nonce, ID); assert.equal(payload.enforceNonce, true);
    if (faults.send && !faults.send.after) throw faults.send;
    const sent = { id: ANN, author: { id: 'bot' }, embeds: payload.embeds.map(e => e.toJSON()) };
    history.set(ANN, sent); if (faults.send) throw faults.send; return sent;
  } };
  const restart = () => load('packages/bot/src/lib/giveawayCompletion.ts', { api: f.api }).completeGiveaway;
  return { f, channel, faults, effects, history, data: () => clone(data), restart,
    complete: () => restart()(f.state().giveaway[0], channel) };
}
test('weighted ticket draw preserves exclusion and unique winners; insufficient and zero entrants terminate', () => {
  const { drawWinners } = load('packages/bot/src/lib/giveawayCompletion.ts');
  const original = Math.random; Math.random = () => 0.6;
  try {
    const winners = drawWinners([{ userId: USER }, { userId: USER }, { userId: 'other' }, { userId: '496523098439548929' }], 20);
    assert.deepEqual(Array.from(winners), [USER, 'other']);
    assert.equal(drawWinners([], 2).length, 0); assert.throws(() => drawWinners([], 0));
  } finally { Math.random = original; }
});
test('successful completion persists winners before send, then sent checkpoint before ending; keeps attachments', async () => {
  const d = discordFixture(); await d.complete();
  assert.deepEqual(d.effects, ['fetch', 'edit', 'edit', 'send', 'edit']);
  assert.equal(d.f.state().giveaway[0].ended, true); assert.equal(d.history.size, 1);
  assert.equal(d.data().components[0].components[0].custom_id, `${ID}-Join-sent-${ANN}`);
  assert.deepEqual(d.data().attachments, ['preserved']);
  assert.ok(!d.data().embeds[0].description.includes('undefined'));
});
test('zero entrants complete with a truthful no-participant announcement', async () => {
  const d = discordFixture(storage({ giveaway: [{ ...base, endsAt: String(NOW - 1) }], giveawayEntry: [] }));
  await d.complete(); assert.match(d.data().embeds[0].description, /No eligible participants/);
  assert.match(d.history.get(ANN).embeds[0].description, /No eligible participants/);
});
test('maximum accepted winner count produces valid Discord content and embeds', async () => {
  const d = discordFixture(storage({ giveaway: [{ ...base, numOfWinners: 100, endsAt: String(NOW - 1) }],
    giveawayEntry: Array.from({ length: 100 }, (_, i) => ({ giveawayId: ID, userDiscordId: String(10000000000000000000n + BigInt(i)) })) }));
  const send = d.channel.send;
  d.channel.send = async payload => {
    assert.ok(payload.content.length <= 2000); payload.embeds.forEach(embed => embed.toJSON()); return send(payload);
  };
  await d.complete(); assert.equal((d.data().embeds[0].description.match(/<@/g) ?? []).length, 100);
});
test('failed fetch/edit and unknown persisted draw recover after restart without changing winners', async () => {
  for (const stage of ['fetch', 'edit']) {
    const d = discordFixture(); d.faults[stage] = Error('offline');
    await assert.rejects(d.complete()); assert.equal(d.f.state().giveaway[0].ended, false); assert.equal(d.history.size, 0);
    delete d.faults[stage]; await d.complete(); assert.equal(d.history.size, 1);
  }
  const d = discordFixture(); d.faults.edit = Object.assign(Error('response lost'), { after: true });
  await assert.rejects(d.complete()); const winners = d.data().embeds[0].description;
  await d.complete(); assert.equal(d.data().embeds[0].description, winners); assert.equal(d.history.size, 1);
});
test('explicit rejected announcements retry the persisted draw; ambiguous sends reconcile after restart', async () => {
  const rejected = discordFixture();
  rejected.faults.send = new discord.DiscordAPIError({ message: 'Missing Permissions', code: 50013 }, 50013, 403, 'POST', 'https://example.invalid', {});
  await assert.rejects(rejected.complete()); assert.equal(rejected.data().components[0].components[0].custom_id, `${ID}-Join-drawn`);
  const winners = rejected.data().embeds[0].description; delete rejected.faults.send;
  await rejected.complete(); assert.equal(rejected.data().embeds[0].description, winners);
  const d = discordFixture(); d.faults.send = Object.assign(Error('response lost'), { after: true });
  await assert.rejects(d.complete()); assert.equal(d.f.state().giveaway[0].ended, false);
  delete d.faults.send; await d.complete();
  assert.equal(d.effects.filter(e => e === 'send').length, 1); assert.equal(d.f.state().giveaway[0].ended, true);
});
test('uncertain unsent/out-of-page/deleted announcement fails closed without redraw or resend', async () => {
  const d = discordFixture(); d.faults.send = Error('transport failure');
  await assert.rejects(d.complete()); const winners = d.data().embeds[0].description;
  delete d.faults.send; await assert.rejects(d.complete(), /outcome uncertain/);
  assert.equal(d.effects.filter(e => e === 'send').length, 1); assert.equal(d.data().embeds[0].description, winners);
  assert.equal(d.f.state().giveaway[0].ended, false);
});
test('completion write failure replays only the guarded DB completion, never announcements', async () => {
  const d = discordFixture(); d.f.fail('giveaway.updateMany');
  await assert.rejects(d.complete()); assert.equal(d.f.state().giveaway[0].ended, false);
  await d.complete(); await d.f.caller.endGiveaway({ giveawayId: ID });
  assert.equal(d.effects.filter(e => e === 'send').length, 1); assert.equal(d.f.state().giveaway[0].ended, true);
});
test('unknown successful completion write and lost final checkpoint both recover without another send', async () => {
  const d = discordFixture(), original = d.f.api.giveaway.endGiveaway.mutate;
  d.f.api.giveaway.endGiveaway.mutate = async input => { await original(input); throw Error('Lost completion response'); };
  await assert.rejects(d.complete()); assert.equal(d.f.state().giveaway[0].ended, true);
  d.f.api.giveaway.endGiveaway.mutate = original; await d.complete();
  assert.equal(d.effects.filter(e => e === 'send').length, 1);
  const checkpoint = discordFixture(), send = checkpoint.channel.send;
  checkpoint.channel.send = async payload => {
    const result = await send(payload); checkpoint.faults.edit = Error('Lost checkpoint'); return result;
  };
  await assert.rejects(checkpoint.complete()); assert.equal(checkpoint.f.state().giveaway[0].ended, false);
  await checkpoint.complete(); assert.equal(checkpoint.effects.filter(e => e === 'send').length, 1);
});
test('history errors or unrelated messages cannot turn uncertain delivery into completion', async () => {
  const d = discordFixture(); d.faults.send = Error('Unknown send'); await assert.rejects(d.complete());
  d.history.set('wrong', { id: ANN, author: { id: 'other-bot' }, embeds: [{ footer: { text: `Giveaway ${ID}` } }] });
  await assert.rejects(d.complete(), /uncertain/);
  d.faults.history = Error('History unavailable'); await assert.rejects(d.complete(), /History unavailable/);
  assert.equal(d.f.state().giveaway[0].ended, false); assert.equal(d.effects.filter(e => e === 'send').length, 1);
});

function buttonFixture(f = storage()) {
  const responses = [], client = {};
  const { InteractionCreateListener, errors } = load('packages/bot/src/listeners/interactionCreate.ts', { api: f.api, client });
  const interaction = { isButton: () => true, inGuild: () => true, customId: `${ID}-Join`, user: { id: USER },
    deferReply: async function () { if (this.ack) throw Error('Already acknowledged'); this.ack = true; this.deferred = true; },
    editReply: async response => responses.push(response), reply: async response => responses.push(response), followUp: async response => responses.push(response) };
  return { f, responses, errors, interaction, listener: new InteractionCreateListener() };
}
test('Join acknowledges before one atomic call; duplicate delivery cannot pay twice; missing/dead routes are guarded', async () => {
  const b = buttonFixture(); await Promise.all([b.listener.run(b.interaction), b.listener.run(b.interaction)]);
  assert.equal(b.f.state().giveawayEntry.length, 1); assert.equal(b.f.state().user[0].cash, 90);
  assert.ok(b.responses.some(r => /joined/.test(r.content)));
  const before = b.f.calls.length;
  for (const changes of [{ isButton: () => false }, { inGuild: () => false }, { customId: 'unrelated' }]) await b.listener.run({ ...b.interaction, ...changes });
  assert.equal(b.f.calls.length, before);
});
test('lost post-payment reply and listener restart never automatically repeat a financial mutation', async () => {
  const b = buttonFixture(); b.interaction.editReply = async () => { throw Error('reply expired'); };
  await b.listener.run(b.interaction); assert.equal(b.f.state().user[0].cash, 90); assert.equal(b.f.state().giveawayEntry.length, 1);
  const restarted = buttonFixture(b.f); await restarted.listener.run({ ...b.interaction });
  assert.equal(b.f.state().giveawayEntry.length, 1); assert.equal(b.f.state().user[0].cash, 90);
});
test('failed or uncertain initial acknowledgement performs no payment', async () => {
  const b = buttonFixture(); b.interaction.deferReply = async () => { throw Error('Unknown acknowledgement outcome'); };
  await b.listener.run(b.interaction); assert.equal(b.f.calls.length, 0); assert.equal(b.f.state().user[0].cash, 100);
});
test('command validates before deferral and creates record before exposing buttons; failures are contained', async () => {
  for (const changes of [{ 'entry-fee': -1 }, { entries: 0 }, { winners: 101 }, { 'ends-at': 'bad' }, { 'ends-at': String(NOW) }]) {
    const f = storage(), responses = [], client = { activeGiveaways: new Map() };
    const { GiveawayCommand } = load('packages/bot/src/commands/guild/giveaway.ts', { api: f.api, client });
    const values = { prize: 'Prize', 'ends-at': String(NOW + 10000), ...changes };
    await new GiveawayCommand().chatInputRun({ options: { getString: key => values[key], getInteger: key => values[key] ?? null, getUser: () => null, getAttachment: () => null },
      reply: async response => responses.push(response), deferReply: () => { throw Error('Must validate first'); } });
    assert.equal(responses.length, 1); assert.equal(f.calls.length, 0);
  }
  const f = storage({ giveaway: [] }), order = [], client = { activeGiveaways: new Map() };
  const create = f.api.giveaway.create.mutate;
  f.api.giveaway.create.mutate = async input => { order.push('create'); return create(input); };
  f.api.setting = { getByKey: { mutate: async () => 'coin' } };
  const { GiveawayCommand } = load('packages/bot/src/commands/guild/giveaway.ts', { api: f.api, client });
  await new GiveawayCommand().chatInputRun({ id: ID, channelId: 'channel', guildId: 'guild', member: { displayHexColor: '#123456' },
    options: { getString: key => key === 'prize' ? 'Prize' : String(NOW + 10000), getInteger: () => null, getUser: () => null, getAttachment: () => null },
    deferReply: async () => {}, editReply: async payload => { order.push(payload.components?.length ? 'buttons' : 'placeholder'); }, fetchReply: async () => ({ id: ID }) });
  assert.deepEqual(order, ['placeholder', 'create', 'buttons']);
  assert.equal(client.activeGiveaways.get(ID), NOW + 10000);
});
test('ready reloads active records after restart; overlapping delayed ticks complete each giveaway only once', async () => {
  const d = discordFixture(), timer = {}, gate = deferred();
  const fetch = d.channel.messages.fetch; d.channel.messages.fetch = async input => { await gate.promise; return fetch(input); };
  const guild = { members: { fetch: async () => {} }, roles: { fetch: async () => {}, cache: new discord.Collection() } };
  const client = { user: { username: 'Fixture', id: 'bot' }, intervals: {}, activeGiveaways: new Map(), on() {},
    guilds: { fetch: async () => guild }, channels: { cache: new Map([['channel', Object.assign(d.channel, { id: 'channel', guildId: 'guild', type: discord.ChannelType.GuildText })]]) } };
  d.f.api.setting = { getByKey: { mutate: async () => 'inmate' } };
  const clock = { now: 1762695426597 }; // Keep topic work outside this isolated test.
  const { ReadyListener } = load('packages/bot/src/listeners/ready.ts', { api: d.f.api, client, timer, clock });
  await new ReadyListener().run(client); assert.deepEqual(Array.from(client.activeGiveaways.keys()), [ID]);
  clock.now = NOW; const first = timer.tick(); await settle();
  await timer.tick(); await timer.tick(); assert.equal(d.effects.length, 0);
  gate.resolve(); await first;
  assert.equal(d.effects.filter(e => e === 'send').length, 1); assert.equal(client.activeGiveaways.size, 0);
  await timer.tick(); assert.equal(d.effects.filter(e => e === 'send').length, 1);
});

test('stored giveaway location wins over configuration and legacy location requires the bot message', async () => {
  const recorded = [];
  const legacyChannel = {
    id: 'channel', guildId: 'guild', type: discord.ChannelType.GuildText,
    messages: { fetch: async ({ message }) => ({ id: message, author: { id: 'bot' } }) },
  };
  const movedChannel = { id: 'original', guildId: 'guild', type: discord.ChannelType.GuildText };
  const client = { user: { id: 'bot' }, channels: { cache: new Map([['channel', legacyChannel], ['original', movedChannel]]) } };
  const api = { giveaway: { recordLegacyLocation: { mutate: async input => { recorded.push(input); } } } };
  const { giveawayChannel } = load('packages/bot/src/lib/giveawayLocation.ts', { api, client });
  assert.equal(await giveawayChannel(client, { ...base, channelId: 'original' }), movedChannel);
  assert.equal(recorded.length, 0);
  const legacy = { ...base, channelId: null, guildId: null };
  assert.equal(await giveawayChannel(client, legacy), legacyChannel);
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0].messageId, base.messageId);
  assert.equal(recorded[0].channelId, 'channel');
  legacyChannel.messages.fetch = async () => ({ author: { id: 'another-bot' } });
  await assert.rejects(giveawayChannel(client, legacy), /verify the original/);
  assert.equal(recorded.length, 1);
  await assert.rejects(giveawayChannel(client, { ...base, channelId: 'original' }, 'other-guild'), /operator review/);
});
