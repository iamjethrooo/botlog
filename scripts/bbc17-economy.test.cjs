// Offline fixtures: actual routers/commands, optimistic serializable mock storage.
// Run: node --test scripts/bbc17-economy.test.cjs
// No env files, application entrypoints, Prisma engines or network are loaded.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { initTRPC } = require('@trpc/server');
const { EmbedBuilder, Collection, ApplicationCommandOptionType } = require('discord.js');
const root = path.resolve(__dirname, '..');
const t = initTRPC.create();
const clone = x => structuredClone(x);
const container = { client: { intervals: {} } };

function load(file, trpc) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true },
  }).outputText;
  vm.runInNewContext(source, {
    exports, console: { error() {}, log() {} }, Date, Number,
    require(id) {
      if (id === '../trpc' && file.includes('/api/')) return { t };
      if (id === '../../trpc' && file.includes('/bot/')) return { trpcNode: trpc };
      if (id === '@trpc/server' || id === 'zod' || id === 'discord-api-types/v10') return require(id);
      if (id === '@trpc/client') return { getFetch: () => () => { throw Error('Network forbidden'); } };
      if (id === '../economy') return load('packages/api/src/economy.ts');
      // Load the actual error boundary; this suite must never send a Discord request.
      if (id === '../discord') return load('packages/api/src/discord.ts');
      if (id === '../guildAccess') return load('packages/api/src/guildAccess.ts');
      if (id === './discord') return load('packages/api/src/discord.ts');
      if (id === '../guildFeatureHealth') return load('packages/api/src/guildFeatureHealth.ts');
      if (id === '@sapphire/decorators') return { ApplyOptions: () => x => x };
      if (id === '@sapphire/framework') return { Command: class {}, container };
      if (id === 'discord.js') return { EmbedBuilder, ApplicationCommandOptionType };
      throw Error('Offline fixture forbids dependency: ' + id);
    },
  }, { filename: file });
  return exports;
}
const userRouter = load('packages/api/src/routers/user.ts').userRouter;
const itemRouter = load('packages/api/src/routers/item.ts').itemRouter;
const inventoryRouter = load('packages/api/src/routers/inventory.ts').inventoryRouter;
const guildRouter = load('packages/api/src/routers/guild.ts').guildRouter;

function fixture(overrides = {}) {
  let state = {
    user: [{ discordId: 'sender', id: 'internal-sender', name: 'Sender', cash: 100, lastRobDate: '0', lastBodyguardDate: '0' },
      { discordId: 'recipient', id: 'internal-recipient', name: 'Recipient', cash: 10, lastRobDate: '0', lastBodyguardDate: '0' }],
    guild: [{ id: 'guild', bank: 0, thievesBank: 0 }],
    item: [{ id: 1, name: 'Apple', buyPrice: 20, stock: 5, percentage: false, stackable: true, roleGiven: null }],
    inventory: [],
    setting: [{ settingKey: 'startingCash', settingValue: '15000' },
      { settingKey: 'robCooldown', settingValue: '3600' }, { settingKey: 'bodyguardDuration', settingValue: '3600' }],
    ...overrides,
  };
  let version = 0, attempts = 0, fail, commitError;
  const calls = [];
  const matches = (row, where = {}) => Object.entries(where).every(([key, value]) => {
    if (key === 'userDiscordId_itemId') return matches(row, value);
    if (value && typeof value === 'object') return Object.entries(value).every(([op, n]) => {
      if (op === 'gte') return row[key] >= n;
      if (op === 'gt') return row[key] > n;
      throw Error('Unhandled filter ' + op);
    });
    return row[key] === value;
  });
  const apply = (row, data) => {
    for (const [key, value] of Object.entries(data)) {
      row[key] = value && typeof value === 'object' && ('increment' in value || 'decrement' in value)
        ? row[key] + (value.increment ?? -value.decrement) : value;
    }
  };
  function client(getState, write) {
    return Object.fromEntries(['user', 'guild', 'item', 'inventory', 'setting'].map(entity => [entity,
      Object.fromEntries(['findUnique', 'findMany', 'update', 'updateMany', 'create', 'upsert'].map(method => [method, async (args = {}) => {
        const route = `${entity}.${method}`;
        calls.push({ route, args: clone(args) });
        if (fail?.route === route && fail.remaining-- > 0) throw Object.assign(Error('Injected write failure'), { code: fail.code });
        const rows = getState()[entity];
        const row = rows.find(r => matches(r, args.where));
        if (method === 'findUnique') return clone(row ?? null);
        if (method === 'findMany') return clone(rows.filter(r => matches(r, args.where)));
        if (method === 'updateMany') {
          const matched = rows.filter(r => matches(r, args.where));
          matched.forEach(r => apply(r, args.data));
          if (matched.length) write();
          return { count: matched.length };
        }
        if (method === 'update') {
          if (!row) throw Object.assign(Error('Missing row'), { code: 'P2025' });
          apply(row, args.data); write(); return clone(row);
        }
        if (method === 'upsert' && row) { apply(row, args.update); write(); return clone(row); }
        const created = clone(method === 'upsert' ? args.create : args.data);
        if (entity === 'user') Object.assign(created, { id: 'new-id', lastRobDate: '0', lastBodyguardDate: '0' });
        rows.push(created); write(); return clone(created);
      }]))]));
  }
  const prisma = client(() => state, () => version++);
  prisma.$transaction = async (operation, options) => {
    assert.equal(options.isolationLevel, 'Serializable');
    attempts++;
    const snapshotVersion = version;
    const snapshot = clone(state);
    let dirty = false;
    const result = await operation(client(() => snapshot, () => { dirty = true; }));
    if (version !== snapshotVersion) throw Object.assign(Error('Write conflict'), { code: 'P2034' });
    if (dirty) { state = snapshot; version++; }
    if (commitError) throw Object.assign(Error('Commit outcome unknown'), { code: commitError });
    return result;
  };
  const caller = router => router.createCaller({ prisma, session: null });
  return {
    user: caller(userRouter), item: caller(itemRouter), inventory: caller(inventoryRouter), guild: caller(guildRouter),
    state: () => clone(state), calls, attempts: () => attempts,
    fail: (route, code = 'FAIL', remaining = 1) => { fail = { route, code, remaining }; },
    unknownCommit: code => { commitError = code; },
  };
}
const transfer = (f, overrides = {}) => f.user.transfer({ sourceId: 'sender', recipientId: 'recipient', recipientName: 'Recipient', amount: 20, ...overrides });
const purchase = (f, overrides = {}) => f.item.purchase({ userId: 'sender', guildId: 'guild', itemId: 1, roleGiven: null, ...overrides });

test('concurrent cash, guild-bank and inventory arithmetic preserves every delta and identities', async () => {
  const f = fixture({ inventory: [{ userDiscordId: 'sender', itemId: 1, amount: 2 }] });
  await Promise.all([f.user.addCash({ id: 'sender', cash: 10 }), f.user.addCash({ id: 'sender', cash: 20 }), f.user.subtractCash({ id: 'sender', cash: 5 })]);
  await Promise.all([f.guild.addToBank({ id: 'guild', amount: 10 }), f.guild.addToBank({ id: 'guild', amount: 20 }), f.guild.subtractFromBank({ id: 'guild', amount: 5 })]);
  await Promise.all([f.guild.addToThievesBank({ id: 'guild', amount: 10 }), f.guild.addToThievesBank({ id: 'guild', amount: 20 })]);
  await Promise.all([f.inventory.incrementUserItemAmount({ userId: 'sender', itemId: 1 }), f.inventory.incrementUserItemAmount({ userId: 'sender', itemId: 1 })]);
  assert.equal(f.state().user[0].cash, 125);
  assert.equal(f.state().user[0].id, 'internal-sender');
  assert.equal(f.state().guild[0].bank, 25);
  assert.equal(f.state().guild[0].thievesBank, 30);
  assert.equal(f.state().inventory[0].amount, 4);
});

test('economy inputs preserve signed adjustments and unlimited stock but reject invalid quantities', async () => {
  const f = fixture();
  await f.user.subtractCash({ id: 'sender', cash: 101 });
  await f.guild.subtractFromBank({ id: 'guild', amount: 1 });
  assert.equal(f.state().user[0].cash, -1);
  assert.equal(f.state().guild[0].bank, -1);
  const item = { name: 'New item', emoji: '', description: '', buyPrice: 0, stock: -2,
    stackable: true, consumable: true, roleGiven: '' };
  await f.item.create(item);
  await f.inventory.create({ userId: 'sender', itemId: 1, amount: 0 });
  for (const invalid of [-1, 0.5, 2147483648]) {
    await assert.rejects(f.inventory.create({ userId: 'sender', itemId: 1, amount: invalid }), { code: 'BAD_REQUEST' });
    await assert.rejects(f.item.create({ ...item, buyPrice: invalid }), { code: 'BAD_REQUEST' });
  }
  await assert.rejects(f.user.addCash({ id: 'sender', cash: 0.5 }), { code: 'BAD_REQUEST' });
  await assert.rejects(f.guild.addToBank({ id: 'guild', amount: 2147483648 }), { code: 'BAD_REQUEST' });
});

test('existing/new recipients receive funds, sender is debited, starting cash is applied once', async () => {
  const f = fixture();
  await transfer(f);
  assert.equal(f.state().user[0].cash, 80);
  assert.equal(f.state().user[1].cash, 30);
  await Promise.all([transfer(f, { recipientId: 'new', recipientName: 'New User' }), transfer(f, { recipientId: 'new', recipientName: 'New User' })]);
  assert.equal(f.state().user[0].cash, 40);
  assert.equal(f.state().user.find(u => u.discordId === 'new').cash, 15040);
  assert.equal(f.state().user.find(u => u.discordId === 'new').name, 'New User');
});

test('invalid/self transfers and insufficient funds leave storage untouched', async () => {
  for (const input of [{ amount: 0 }, { amount: -1 }, { amount: NaN }, { amount: Infinity }, { amount: 1.5 }, { amount: 2147483648 }, { recipientId: 'sender' }, { amount: 101, recipientId: 'new' }]) {
    const f = fixture(), before = f.state();
    await assert.rejects(transfer(f, input));
    assert.deepEqual(f.state(), before);
  }
});

test('recipient write failure rolls back sender; competing transfers cannot overspend', async () => {
  const f = fixture(), before = f.state();
  f.fail('user.upsert');
  await assert.rejects(transfer(f, { recipientId: 'new' }));
  assert.deepEqual(f.state(), before);
  const outcomes = await Promise.allSettled([transfer(f, { amount: 80 }), transfer(f, { amount: 80, recipientId: 'new' })]);
  assert.equal(outcomes.filter(o => o.status === 'fulfilled').length, 1);
  assert.equal(f.state().user[0].cash, 20);
});

test('purchase rollback covers stock, inventory, bank, cash and special-item dates', async () => {
  for (const name of ['Apple', 'Bodyguard', 'Refresher Orb', 'Role']) {
    for (const failure of ['item.updateMany', 'inventory.upsert', 'guild.update']) {
      if (['Bodyguard', 'Refresher Orb'].includes(name) && failure === 'inventory.upsert') continue;
      const f = fixture();
      const item = f.state().item[0];
      item.name = name;
      if (name === 'Bodyguard') item.systemKey = 'BODYGUARD';
      if (name === 'Refresher Orb') item.systemKey = 'REFRESHER_ORB';
      if (name === 'Role') item.roleGiven = 'role';
      const users = f.state().user;
      users[0].lastRobDate = String(Date.now());
      const g = fixture({ item: [item], user: users });
      const before = g.state();
      g.fail(failure);
      await assert.rejects(purchase(g, { roleGiven: item.roleGiven }));
      assert.deepEqual(g.state(), before, `${name}: ${failure}`);
    }
  }
});

test('concurrent stackable purchases preserve cash, bank, stock and inventory', async () => {
  const f = fixture();
  await Promise.all([purchase(f), purchase(f)]);
  assert.equal(f.state().user[0].cash, 60);
  assert.equal(f.state().guild[0].bank, 40);
  assert.equal(f.state().item[0].stock, 3);
  assert.equal(f.state().inventory[0].amount, 2);
  assert.ok(f.attempts() > 2, 'optimistic mock forces a rolled-back serialization conflict');
});

test('concurrent purchase and transfer share the funds guard', async () => {
  const f = fixture();
  const outcomes = await Promise.allSettled([purchase(f), transfer(f, { amount: 90 })]);
  assert.equal(outcomes.filter(o => o.status === 'fulfilled').length, 1);
  const s = f.state();
  assert.equal(s.user[0].cash + s.user[1].cash + s.guild[0].bank, 110);
});

test('last stock unit sells once; zero rejects; negative stock remains unlimited', async () => {
  const limited = fixture();
  const item = limited.state().item[0]; item.stock = 1;
  const users = limited.state().user; users[1].cash = 100;
  const f = fixture({ item: [item], user: users });
  const outcomes = await Promise.allSettled([purchase(f), purchase(f, { userId: 'recipient' })]);
  assert.equal(outcomes.filter(o => o.status === 'fulfilled').length, 1);
  assert.equal(f.state().item[0].stock, 0);
  const before = f.state();
  await assert.rejects(purchase(f));
  assert.deepEqual(f.state(), before);
  item.stock = -1;
  const g = fixture({ item: [item] });
  await Promise.all([purchase(g), purchase(g)]);
  assert.equal(g.state().item[0].stock, -1);
});

test('legacy stock operation also guards limited stock atomically', async () => {
  const item = fixture().state().item[0]; item.stock = 1;
  const f = fixture({ item: [item] });
  const outcomes = await Promise.allSettled([f.item.buyItem({ id: 1 }), f.item.buyItem({ id: 1 })]);
  assert.equal(outcomes.filter(o => o.status === 'fulfilled').length, 1);
  assert.equal(f.state().item[0].stock, 0);
});

test('non-stackable ownership and insufficient funds reject without partial state', async () => {
  const item = fixture().state().item[0]; item.stackable = false;
  const f = fixture({ item: [item] });
  const outcomes = await Promise.allSettled([purchase(f), purchase(f)]);
  assert.equal(outcomes.filter(o => o.status === 'fulfilled').length, 1);
  assert.equal(f.state().inventory[0].amount, 1);
  assert.equal(f.state().user[0].cash, 80);
  const before = f.state();
  await assert.rejects(purchase(f, { userId: 'recipient' }));
  assert.deepEqual(f.state(), before);
});

test('percentage pricing uses the transactional balance and preserves bodyguard cooldown', async () => {
  const item = fixture().state().item[0]; Object.assign(item, { percentage: true, buyPrice: 10 });
  const f = fixture({ item: [item] });
  await Promise.all([purchase(f), purchase(f)]);
  assert.equal(f.state().user[0].cash, 81);
  assert.equal(f.state().guild[0].bank, 19);
  item.name = 'Bodyguard'; item.systemKey = 'BODYGUARD';
  const g = fixture({ item: [item] });
  await purchase(g);
  assert.equal(g.state().inventory.length, 0);
  assert.ok(Number(g.state().user[0].lastBodyguardDate) > 0);
  const before = g.state();
  await assert.rejects(purchase(g), /already have/);
  assert.deepEqual(g.state(), before);
  const users = g.state().user;
  users[0].lastBodyguardAt = new Date(Date.now() - 2 * 86400000);
  users[0].lastBodyguardDate = String(users[0].lastBodyguardAt.getTime());
  const h = fixture({ item: [item], user: users });
  await assert.rejects(purchase(h), /every 5 days/);
});

test('refresher orb only resets an active rob cooldown as part of payment', async () => {
  const item = fixture().state().item[0]; item.name = 'Refresher Orb'; item.systemKey = 'REFRESHER_ORB';
  const f = fixture({ item: [item] });
  await assert.rejects(purchase(f), /on cooldown/);
  const users = f.state().user; users[0].lastRobDate = String(Date.now());
  const g = fixture({ item: [item], user: users });
  await purchase(g);
  assert.equal(g.state().user[0].lastRobDate, '0');
  assert.equal(g.state().user[0].cash, 80);
  assert.equal(g.state().guild[0].bank, 20);
  assert.equal(g.state().inventory.length, 0);
});

test('role entitlement survives delivery failure/restart and concurrent retry charges once', async () => {
  const item = fixture().state().item[0]; item.roleGiven = 'role';
  const f = fixture({ item: [item] });
  const outcomes = await Promise.all([purchase(f, { roleGiven: 'role' }), purchase(f, { roleGiven: 'role' })]);
  assert.equal(outcomes.filter(o => o.recovery).length, 1);
  assert.equal(f.state().user[0].cash, 80);
  assert.equal(f.state().guild[0].bank, 20);
  assert.equal(f.state().item[0].stock, 4);
  assert.equal(f.state().inventory[0].amount, 1);
  const restarted = fixture(f.state()), before = restarted.state();
  assert.equal((await purchase(restarted, { roleGiven: 'role' })).recovery, true);
  assert.deepEqual(restarted.state(), before);
});

test('catalog role drift fails before payment', async () => {
  const f = fixture(), before = f.state();
  await assert.rejects(purchase(f, { roleGiven: 'wrong-role' }), /item changed/);
  assert.deepEqual(f.state(), before);
});

test('only rolled-back conflicts retry; retry limit and unknown commit outcome are explicit', async () => {
  for (const code of ['P2034', 'P2002']) {
    const f = fixture(); f.fail('guild.update', code);
    await purchase(f);
    assert.equal(f.attempts(), 2);
    assert.equal(f.state().user[0].cash, 80);
    assert.equal(f.state().inventory[0].amount, 1);
  }
  const f = fixture(), before = f.state(); f.fail('guild.update', 'P2034', 10);
  await assert.rejects(purchase(f));
  assert.equal(f.attempts(), 3);
  assert.deepEqual(f.state(), before);
  const g = fixture(); g.unknownCommit('TRANSPORT');
  await assert.rejects(purchase(g));
  assert.equal(g.attempts(), 1);
  assert.equal(g.state().user[0].cash, 80);
});

function commandApi(f) {
  const api = {};
  const invoke = (router, method) => async input => {
    try { return await f[router][method](input); }
    catch (error) { throw { message: error.message, data: { code: error.code } }; }
  };
  for (const router of ['user', 'item', 'inventory']) api[router] = new Proxy({}, { get: (_, method) => ({ mutate: invoke(router, method), query: invoke(router, method) }) });
  api.setting = { getByKey: { mutate: async ({ key }) => ({ coinEmoji: 'coin', redColor: 'ff0000', greenColor: '00ff00' })[key] } };
  return api;
}
const discordUser = id => ({ id, username: id, displayAvatarURL: () => 'https://example.com/avatar.png' });

test('message and slash transfer commands invoke the same atomic operation and reply truthfully', async () => {
  const f = fixture(), api = commandApi(f);
  const { TransferCommand } = load('packages/bot/src/commands/economy/transfer.ts', api);
  const command = new TransferCommand();
  let response;
  const message = { author: discordUser('sender'), member: { displayHexColor: '#123456' }, mentions: { users: new Collection([['recipient', discordUser('recipient')]]) }, reply: async x => { response = x; } };
  await command.messageRun(message, { pick: async () => 20 });
  assert.match(response.embeds[0].data.description, /Gave/);
  await command.chatInputRun({ user: message.author, member: message.member, deferReply: async () => {}, editReply: message.reply,
    options: { getUser: () => discordUser('new'), getInteger: () => 30 } });
  assert.equal(f.state().user[0].cash, 50);
  assert.equal(f.state().user.find(u => u.discordId === 'new').cash, 15030);
  await command.messageRun(message, { pick: async () => -1 });
  assert.match(response.embeds[0].data.description, /positive whole/);
  await command.messageRun(message, { pick: async () => 100 });
  assert.match(response.embeds[0].data.description, /current balance/);
});

test('buy command awaits failed role delivery and retry grants one role without another payment', async () => {
  const item = fixture().state().item[0]; item.roleGiven = 'role';
  const f = fixture({ item: [item] }), api = commandApi(f);
  const { BuyCommand } = load('packages/bot/src/commands/economy/buy.ts', api);
  const command = new BuyCommand();
  let response, deliveries = 0;
  const roles = new Set();
  const member = { id: 'sender', user: discordUser('sender'), roles: { add: async role => { deliveries++; if (deliveries === 1) throw Error('Discord failed'); roles.add(role); } },
    guild: { id: 'guild', roles: { fetch: async () => ({ id: 'role' }) }, members: { fetch: async () => ({ roles: { cache: roles } }) } } };
  const message = { member, channel: { send: async x => { response = x; } } };
  await command.messageRun(message, { rest: async () => 'Apple' });
  assert.match(response.embeds[0].data.description, /is paid.*Retry/);
  assert.equal(f.state().user[0].cash, 80);
  await command.chatInputRun({ member, deferReply: async () => {}, options: { getString: () => 'Apple' }, editReply: message.channel.send });
  assert.match(response.embeds[0].data.description, /You bought/);
  assert.equal(roles.size, 1);
  assert.equal(f.state().user[0].cash, 80);
  assert.equal(f.state().guild[0].bank, 20);
  await command.messageRun(message, { rest: async () => 'Apple' });
  assert.match(response.embeds[0].data.description, /already have/);
  assert.equal(deliveries, 2);
});

test('buy command preserves holdup protection and refuses unavailable roles before payment', async () => {
  const item = fixture().state().item[0]; item.roleGiven = 'role';
  const f = fixture({ item: [item] }), api = commandApi(f), before = f.state();
  const { BuyCommand } = load('packages/bot/src/commands/economy/buy.ts', api);
  let response;
  const member = { id: 'sender', user: discordUser('sender'),
    guild: { id: 'guild', roles: { fetch: async () => null } } };
  const message = { member, channel: { send: async x => { response = x; } } };
  container.client.intervals.holdup = true;
  container.client.holdupVictim = 'sender';
  try {
    await new BuyCommand().messageRun(message, { rest: async () => 'Apple' });
    assert.match(response.embeds[0].data.description, /holdup/);
  } finally { container.client.intervals.holdup = false; }
  await new BuyCommand().messageRun(message, { rest: async () => 'Apple' });
  assert.match(response.embeds[0].data.description, /role is unavailable/);
  assert.deepEqual(f.state(), before);
});

test('invalid starting-balance configuration rolls back new-recipient transfer', async () => {
  const f = fixture({ setting: [{ settingKey: 'startingCash', settingValue: 'invalid' }] });
  const before = f.state();
  await assert.rejects(transfer(f, { recipientId: 'new' }));
  assert.deepEqual(f.state(), before);
});
