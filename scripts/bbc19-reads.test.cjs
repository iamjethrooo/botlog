// Isolated synthetic PostgreSQL; never reads .env or imports app entrypoints.
// node scripts/bbc19-reads.test.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const net = require('node:net');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const ts = require('typescript');
const { initTRPC } = require('@trpc/server');
const { PrismaClient, Prisma } = require('@prisma/client');
const root = path.resolve(__dirname, '..');
const baseline = '6d8f7ae571efae0db854ed361c378bfabe48f3bd';
const bin = 'C:/Program Files/PostgreSQL/15/bin';
const data = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'botlog-bbc19-pg-'));
const result = { node: process.version, prisma: Prisma.prismaVersion.client, baseline, samples: [], checks: [] };
const t = initTRPC.create();
const plain = value => JSON.parse(JSON.stringify(value));
function load(file, old = false, trpc = {}, capture = {}) {
  const source = old ? execFileSync('git', ['show', `${baseline}:${file}`], { cwd: root, encoding: 'utf8' }) : fs.readFileSync(path.join(root, file), 'utf8');
  const exports = {};
  function chain() { return new Proxy({}, { get: (_, key) => (...args) => {
    if (key === 'setItems') capture.items = plain(args[0]);
    if (key === 'setFooter') capture.footer = plain(args[0]);
    if (key === 'setItemsPerPage') capture.pageSize = args[0];
    return chain();
  } }); }
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true,
  } }).outputText, { exports, console: { log: e => { throw e; } }, Math: Object.assign(Object.create(Math), { random: () => 0 }),
    require(id) {
      if (id.endsWith('/trpc')) return file.includes('/api/') ? { t } : { trpcNode: trpc };
      if (id === 'zod') return require(id);
      if (id === '../economy') return load('packages/api/src/economy.ts');
      if (id === '@trpc/server') return require(id);
      if (id === '@sapphire/decorators') return { ApplyOptions: () => x => x };
      if (id === '@sapphire/framework') return { Command: class {} };
      if (id === '@sapphire/discord.js-utilities') return { PaginatedFieldMessageEmbed: chain };
      if (id === 'discord.js') return { EmbedBuilder: chain };
      throw Error('Fixture forbids import: ' + id);
    },
  }, { filename: file });
  return exports;
}
const run = (name, args) => execFileSync(path.join(bin, name + '.exe'), args, {
  encoding: 'utf8', windowsHide: true, timeout: 30000, stdio: 'ignore',
});
async function main() {
  const socket = net.createServer();
  await new Promise((resolve, reject) => { socket.once('error', reject); socket.listen(0, '127.0.0.1', resolve); });
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  let started = false, db;
  try {
    run('initdb', ['-D', data, '-U', 'bbc19_fixture', '--auth=trust', '--no-locale', '-E', 'UTF8']);
    started = true;
    run('pg_ctl', ['-D', data, '-l', path.join(data, 'server.log'), '-o', `-h 127.0.0.1 -p ${port} -F`, '-w', 'start']);
    db = new PrismaClient({ datasources: { db: { url: `postgresql://bbc19_fixture@127.0.0.1:${port}/postgres?connection_limit=1` } }, log: [{ emit: 'event', level: 'query' }] });
    let queries = [];
    db.$on('query', event => {
      // Prisma's pool may validate an idle connection with SELECT 1. Retain
      // this evidence separately from application read-query amplification.
      if (/^SELECT\s+1\s*;?$/i.test(event.query.trim())) {
        result.poolValidationQueries = (result.poolValidationQueries || 0) + 1;
      } else queries.push(event.query);
    });
    // Reproduce installed model scalar columns/defaults only in the new cluster.
    // Existing application schema/indexes/services are never modified.
    for (const name of ['User', 'Item', 'Inventory', 'Setting']) {
      const model = Prisma.dmmf.datamodel.models.find(m => m.name === name);
      const columns = model.fields.filter(f => f.kind !== 'object').map(f => {
        const type = { String: 'text', Int: 'integer', Boolean: 'boolean', DateTime: 'timestamp', Float: 'double precision', Json: 'jsonb' }[f.type];
        assert(type, f.type);
        const value = typeof f.default === 'object' ? (f.type === 'String' ? "''" : f.type === 'DateTime' ? 'CURRENT_TIMESTAMP' : '0') : typeof f.default === 'string' ? `'${f.default.replaceAll("'", "''")}'` : f.default;
        return `"${f.dbName || f.name}" ${type}${f.isRequired ? ' NOT NULL' : ''}${value !== undefined ? ' DEFAULT ' + value : ''}`;
      });
      const keys = (model.primaryKey?.fields || model.fields.filter(f => f.isId).map(f => f.name))
        .map(key => model.fields.find(field => field.name === key).dbName || key);
      if (keys.length) columns.push(`PRIMARY KEY (${keys.map(k => `"${k}"`).join(',')})`);
      for (const field of model.fields.filter(f => f.isUnique)) columns.push(`UNIQUE ("${field.name}")`);
      await db.$executeRawUnsafe(`CREATE TABLE "${name}" (${columns.join(',')})`);
    }
    await db.$executeRawUnsafe('ALTER TABLE "Inventory" ADD FOREIGN KEY ("userId") REFERENCES "User" ("discordId"), ADD FOREIGN KEY ("itemId") REFERENCES "Item" (id)');
    const emptyCaller = load('packages/api/src/routers/user.ts').userRouter.createCaller({ prisma: db });
    queries = [];
    assert.deepEqual(plain(await emptyCaller.getLeaderboard()), { leaderboard: [] });
    result.emptyDatabaseLeaderboardQueries = queries.length;
    assert.equal(queries.length, 2);
    await db.user.createMany({ data: Array.from({ length: 1200 }, (_, i) => ({ id: 'internal' + i, discordId: 'u' + i, name: i < 3 ? ['Zed', 'Amy', 'Joe'][i] : 'Member' + String(i).padStart(4, '0'), cash: i === 1199 ? 15000 : 20000 - Math.floor(i / 3), email: 'private' + i + '@example.invalid', image: 'private-image' })) });
    await db.item.createMany({ data: Array.from({ length: 1001 }, (_, i) => ({ id: i + 1, name: i === 0 ? 'FaKe ID' : i === 1 ? 'fake id' : 'Item ' + i, systemKey: i === 0 ? 'FAKE_ID' : null, emoji: i === 3 ? null : '🍎', buyPrice: 100 })) });
    await db.setting.create({ data: { id: 1, guildId: 'g', settingKey: 'coinEmoji', settingValue: 'coin' } });
    const routers = old => {
      // The old router uses the old Prisma field name. Keep its query count and
      // selected rows while running against the current generated client.
      const inventoryPrisma = old ? { inventory: { findMany: ({ where }) =>
        db.inventory.findMany({ where: { userDiscordId: where.userId } }),
      } } : db;
      return {
      user: load('packages/api/src/routers/user.ts', old).userRouter.createCaller({ prisma: db }),
      inventory: load('packages/api/src/routers/inventory.ts', old).inventoryRouter.createCaller({ prisma: inventoryPrisma }),
      item: { getAll: async () => ({ allItems: await db.item.findMany() }), getItemById: async ({ id }) => ({ item: await db.item.findUnique({ where: { id } }) }) },
      setting: { getByKey: async ({ key }) => (await db.setting.findUnique({ where: { settingKey: key } })).settingValue },
      };
    };
    const oldRoutes = routers(true), newRoutes = routers(false);
    async function command(kind, old, size, slash = false, viewer = 'u0', showAll = false, delay = 0) {
      const routes = old ? oldRoutes : newRoutes;
      let calls = 0;
      const api = new Proxy({}, { get: (_, router) => new Proxy({}, { get: (_, method) => {
        const invoke = async input => { calls++; if (delay) await new Promise(r => setTimeout(r, delay)); return routes[router][method](input); };
        return { query: invoke, mutate: invoke };
      } }) });
      const capture = {};
      const file = `packages/bot/src/commands/economy/${kind}.ts`;
      const Command = load(file, old, api, capture)[kind === 'inventory' ? 'InventoryCommand' : 'LeaderboardCommand'];
      const author = { id: viewer, username: 'Fixture', displayAvatarURL: () => '' };
      const cache = new Map(Array.from({ length: size }, (_, i) => ['u' + i, { permissions: { has: () => true } }]));
      cache.set('missing-member', { permissions: { has: () => true } });
      const guild = { name: 'Fixture', iconURL: () => '', members: { cache } };
      const member = { displayHexColor: '#000000' };
      queries = [];
      const start = performance.now();
      if (slash) await new Command().chatInputRun({ user: author, guild, member });
      else await new Command().messageRun({ author, guild, member }, { pick: async () => showAll ? 'all' : '' });
      const ms = performance.now() - start;
      await new Promise(resolve => setImmediate(resolve)); // Drain asynchronous query-log delivery outside timings.
      return { output: capture, apiCalls: calls, sqlQueries: queries.length, ms, sql: [...queries] };
    }
    async function compare(kind, size, options = {}) {
      const { slash = false, viewer = 'u0', showAll = false, delay = 0 } = options;
      const before = await command(kind, true, size, slash, viewer, showAll, delay);
      const after = await command(kind, false, size, slash, viewer, showAll, delay);
      assert.deepEqual(after.output, before.output, `${kind}:${size}:${JSON.stringify(options)}`);
      assert.equal(after.apiCalls, kind === 'inventory' ? 1 : 2);
      assert(after.sqlQueries <= (kind === 'inventory' ? 2 : 4)); // Includes coin setting for leaderboard.
      return { before, after };
    }
    for (const size of [0, 1, 10, 100, 1000]) {
      const viewer = 'u' + (1100 + [0, 1, 10, 100, 1000].indexOf(size));
      if (size) await db.inventory.createMany({ data: Array.from({ length: size }, (_, i) => ({ userDiscordId: viewer, itemId: i + 1, amount: i % 4 })) });
      for (const slash of [false, true]) {
        const measured = await compare('inventory', size, { slash, viewer });
        assert.equal(measured.before.apiCalls, 1 + size);
        assert.equal(measured.before.sqlQueries, 1 + size);
        assert.equal(measured.after.sqlQueries, size ? 2 : 1);
        assert.equal(measured.after.output.pageSize, 10);
        if (!size) assert.deepEqual(measured.after.output.items, ['Your inventory is empty! :(']);
      }
      const samples = [];
      for (let i = 0; i < 5; i++) samples.push(await compare('inventory', size, { viewer }));
      record('inventory', size, 0, samples);
    }
    await db.inventory.createMany({ data: [{ userDiscordId: 'u0', itemId: 1, amount: 0 }, { userDiscordId: 'u2', itemId: 1, amount: 2 }, { userDiscordId: 'u3', itemId: 2, amount: 1 }, { userDiscordId: 'u1198', itemId: 1, amount: 1 }] });
    for (const size of [0, 1, 10, 1000, 1200]) {
      const samples = [];
      for (let i = 0; i < 5; i++) samples.push(await compare('leaderboard', size));
      record('leaderboard', size, 0, samples);
      for (const slash of [false, true]) for (const viewer of ['u0', 'u1', 'absent']) for (const showAll of [false, true]) {
        const { after } = await compare('leaderboard', size, { slash, viewer, showAll });
        assert.equal(after.output.pageSize, slash ? 20 : 15);
        const expectedRank = viewer === 'u1' && size >= 10 ? 3 : 'N/A';
        assert.equal(after.output.footer.text, `Your leaderboard rank: ${expectedRank}`);
      }
      const output = samples[0].after.output;
      assert.equal(output.pageSize, 15);
      assert.equal(output.items.length, Math.min(size, 1199));
      if (size >= 10) {
        assert(output.items[0].includes('Anonymous Adventurer'));
        assert(output.items[1].includes('Anonymous Adventurer')); // Joe sorts before Amy at equal cash.
        assert(output.items[2].includes('<@u1>'));
        assert(output.items.some(s => s.includes('<@u3>'))); // Second catalog match isn't the selected Fake ID.
        assert(!output.items.some(s => s.includes('<@u1199>'))); // Preserve cash=15000 exclusion.
      }
    }
    const narrow = await newRoutes.user.getLeaderboard();
    assert.deepEqual(Object.keys(narrow.leaderboard[0]).sort(), ['cash', 'discordId', 'hasFakeId']);
    const inventory = await newRoutes.inventory.getDisplayByUserId({ userId: 'u0' });
    assert.deepEqual(Object.keys(inventory.inventory[0]).sort(), ['amount', 'item', 'itemId']);
    assert.deepEqual(Object.keys(inventory.inventory[0].item).sort(), ['emoji', 'name']);
    // Same bounded synthetic per-call delay as BBC-16; end-to-end local SQL +
    // requested API delay, not real network/Discord/Neon latency.
    const delayed = [];
    await compare('leaderboard', 10, { delay: 5 }); // warmup
    for (let i = 0; i < 3; i++) delayed.push(await compare('leaderboard', 10, { delay: 5 }));
    record('leaderboard', 10, 5, delayed);
    for (const [size, viewer] of [[10, 'u1102'], [100, 'u1103']]) {
      const invDelayed = [];
      await compare('inventory', size, { delay: 5, viewer });
      for (let i = 0; i < 3; i++) invDelayed.push(await compare('inventory', size, { delay: 5, viewer }));
      record('inventory', size, 5, invDelayed);
    }
    await db.item.update({ where: { id: 1 }, data: { name: 'Renamed disguise' } });
    const guildResult = await newRoutes.user.getGuildLeaderboard({ memberIds: ['u0', 'u0', 'u3', 'u1199', 'departed'] });
    assert.deepEqual(plain(guildResult.leaderboard.map(({ discordId, hasFakeId }) => [discordId, hasFakeId])),
      [['u0', true], ['u3', false]]);
    // Query evidence excludes setup and timing measurements.
    queries = [];
    await newRoutes.user.getGuildLeaderboard({ memberIds: ['u0', 'u1'] });
    result.leaderboardSql = [...queries];
    queries = [];
    await newRoutes.inventory.getDisplayByUserId({ userId: 'u0' });
    result.inventorySql = [...queries];
    result.checks.push('prefix/slash rendered output equivalence', 'empty and multi-item inventories, zero quantities and null emoji', '1/10/1000/1200 users; departed and missing cached members; administrators retained', 'cash/name descending ties; cash=15000 exclusion', 'Fake ID stable key; zero-quantity ownership; anonymous rank N/A', 'request/query count bounds; narrow response keys; membership filtering in PostgreSQL');
    const output = process.env.BOTLOG_QUERY_RESULTS_DIR || __dirname;
    fs.writeFileSync(path.join(output, 'bbc19-results.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify({ samples: result.samples, checks: result.checks }, null, 2));
  } finally {
    if (db) await db.$disconnect();
    if (started) run('pg_ctl', ['-D', data, '-m', 'fast', '-w', 'stop']);
    // Retain only synthetic fixture data for review; no recursive deletion.
    console.log('Stopped isolated fixture; retained synthetic data: ' + data);
  }
}
function record(kind, size, delay, pairs) {
  const summarize = side => {
    const timings = pairs.map(p => p[side].ms).sort((a, b) => a - b);
    const counts = pairs.map(p => [p[side].apiCalls, p[side].sqlQueries]);
    assert(counts.every(c => c[0] === counts[0][0] && c[1] === counts[0][1]), `${kind}:${size}:${side}: ${JSON.stringify(counts)} extra statements: ${JSON.stringify(pairs.flatMap(p => p[side].sql.filter(s => !s.includes('FROM'))))}`);
    return { apiCalls: counts[0][0], sqlQueries: counts[0][1], medianMs: +timings[Math.floor(timings.length / 2)].toFixed(3), p95Ms: +timings[Math.ceil(timings.length * .95) - 1].toFixed(3) };
  };
  result.samples.push({ kind, size, requestedDelayMs: delay, samples: pairs.length, before: summarize('before'), after: summarize('after') });
}
main().catch(error => { console.error(error); process.exitCode = 1; });
