// Called by the PostgreSQL recovery rehearsal with its disposable restore URL.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { initTRPC } = require('@trpc/server');
const { PrismaClient } = require('@prisma/client');

function loadRouters() {
  const t = initTRPC.create();
  const modules = new Map();
  function load(file) {
    if (modules.has(file)) return modules.get(file);
    const exports = {};
    const source = fs.readFileSync(path.join(__dirname, '../packages/api/src', file + '.ts'), 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    });
    new Function('exports', 'require', outputText)(exports, id => {
      if (id === '../trpc') return { t };
      if (id === '../economy') return load('economy');
      if (['zod', '@trpc/server'].includes(id)) return require(id);
      throw new Error('Unexpected fixture import: ' + id);
    });
    modules.set(file, exports);
    return exports;
  }
  return {
    ...load('routers/user'), ...load('routers/robLog'), ...load('routers/holdupLog'),
  };
}

async function verifySchemaAudit(databaseUrl, explain) {
  assert.equal(new URL(databaseUrl).hostname, '127.0.0.1');
  assert.equal(new URL(databaseUrl).pathname, '/rehearsal_restore');
  const queries = [];
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: [{ emit: 'event', level: 'query' }],
  });
  prisma.$on('query', query => queries.push(query));
  try {
    const { userRouter, robLogRouter, holdupLogRouter } = loadRouters();
    const user = userRouter.createCaller({ prisma });
    const rob = robLogRouter.createCaller({ prisma });
    const holdup = holdupLogRouter.createCaller({ prisma });
    const event = id => String(100000000000000000n + BigInt(id));
    const settings = {
      startingCash: 150, minCashPerChat: 10, maxCashPerChat: 10, interval: 60,
      robChance: 1, robCooldown: 60, robMin: 20, robMax: 20, bodyguardDuration: 3600,
      luckyCharmIncrease: 0, fortuneAmuletIncrease: 0, sentryWardDecrease: 0,
    };
    await prisma.setting.createMany({
      data: Object.entries(settings).map(([settingKey, value]) => ({
        guildId: 'fixture-guild', settingKey, settingValue: String(value),
      })),
    });
    const balance = async discordId => (await prisma.user.findUniqueOrThrow({ where: { discordId } })).cash;
    const claim = (id, userId = 'robber') => user.claimMessageReward({ messageId: event(id), userId, name: userId });
    const created = await Promise.all([claim(1), claim(1)]);
    assert.deepEqual(created, Array(2).fill({ status: 'initialized', amount: 150 }));
    const rewards = await Promise.all([claim(2), claim(3)]);
    assert.deepEqual(rewards.map(result => result.status).sort(), ['awarded', 'cooldown']);
    assert.equal(await balance('robber'), 160);
    const rewarded = await prisma.user.findUniqueOrThrow({ where: { discordId: 'robber' } });
    assert.equal(rewarded.lastMessageRewardAt.getTime(), Number(rewarded.lastMessageDate));

    await prisma.user.createMany({ data: ['victim', 'second-victim', 'third-victim', 'other-robber'].map(discordId => ({
      id: discordId, discordId, cash: 100,
    })) });
    const runRobbery = (id, victimId, robberId = 'robber', guildId = 'fixture-guild') =>
      rob.resolveRobbery({ eventId: event(id), robberId, victimId, guildId });
    // A prefix command and a chat reward can use the same Discord message ID.
    const results = await Promise.all([runRobbery(2, 'victim'), runRobbery(2, 'victim')]);
    assert.deepEqual(results[0], results[1]);
    assert.equal(results[0].status, 'resolved');
    assert.equal(await balance('robber'), 180);
    assert.equal(await balance('victim'), 80);
    assert.equal(await prisma.robLog.count(), 1);
    assert.equal((await runRobbery(4, 'second-victim')).status, 'cooldown');
    assert.equal((await runRobbery(5, 'victim', 'other-robber')).status, 'protected');

    await prisma.setting.update({ where: { settingKey: 'robChance' }, data: { settingValue: '0' } });
    await prisma.user.update({ where: { discordId: 'third-victim' }, data: { lastBodyguardAt: new Date() } });
    await assert.rejects(runRobbery(6, 'third-victim', 'other-robber', 'missing-guild'));
    assert.equal(await balance('other-robber'), 100);
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { discordId: 'other-robber' } })).lastRobAt, null);
    assert.equal(await prisma.robLog.count(), 1);
    assert.equal(await prisma.economyOperation.count({ where: { eventId: event(6) } }), 0);

    await prisma.setting.update({ where: { settingKey: 'interval' }, data: { settingValue: '0' } });
    await Promise.all([claim(7), claim(8)]);
    assert.equal(await balance('robber'), 200);

    await prisma.guild.create({ data: { id: 'second-guild', name: 'Second', ownerDiscordId: 'fixture-discord' } });
    const register = (guildId, id) => prisma.tempChannel.upsert({
      where: { guildId_ownerDiscordId: { guildId, ownerDiscordId: 'owner' } },
      update: { ownerDiscordId: 'owner' },
      create: { guildId, ownerDiscordId: 'owner', id },
    });
    const channels = await Promise.all([register('fixture-guild', 'channel-a'), register('fixture-guild', 'channel-b')]);
    assert.equal(channels[0].id, channels[1].id);
    await register('second-guild', 'channel-c');
    assert.equal(await prisma.tempChannel.count(), 2);
    await prisma.guild.delete({ where: { id: 'second-guild' } });
    assert.equal(await prisma.tempChannel.count(), 1);

    await prisma.$executeRaw`
      INSERT INTO "RobLog" ("robberId", "victimId", timestamp, success)
      SELECT 'r'||g%1200, 'v'||g%1200, now() - g*interval '1 second', g%3<>0
      FROM generate_series(1, 24000) g
    `;
    await prisma.$executeRaw`
      INSERT INTO "HoldupLog" ("leaderId", "victimId", participants, timestamp, success)
      SELECT 'r'||g%1200, 'v'||g%1200, jsonb_build_array('r'||g%1200), now() - g*interval '1 second', g%3<>0
      FROM generate_series(1, 24000) g
    `;
    await prisma.$executeRaw`ANALYZE "RobLog"`;
    await prisma.$executeRaw`ANALYZE "HoldupLog"`;
    const start = queries.length;
    await rob.getLastRobbed({ victimId: 'v1' });
    await rob.getLastVictimRobbed({ robberId: 'r1' });
    await holdup.getLastTimeHeldup({ victimId: 'v1' });
    await holdup.getLastHoldup({ suspectId: 'r1' });
    await new Promise(resolve => setImmediate(resolve));
    const reads = queries.slice(start).filter(query => /^SELECT .*FROM "public"\."(?:RobLog|HoldupLog)"/.test(query.query));
    assert.equal(reads.length, 4);
    const indexNames = [
      'RobLog_victimId_success_timestamp_id_idx',
      'RobLog_robberId_success_timestamp_id_idx',
      'HoldupLog_victimId_success_timestamp_id_idx',
      'HoldupLog_participants_idx',
    ];
    for (const [i, { query, params }] of reads.entries()) {
      // PREPARE lets PostgreSQL infer the wire parameter types as Prisma does,
      // including JSONB for the containment lookup.
      const argumentsSql = JSON.parse(params).map(value =>
        "'" + (typeof value === 'string' ? value : JSON.stringify(value)).replaceAll("'", "''") + "'",
      ).join(', ');
      const plan = explain(`
        SET plan_cache_mode = force_generic_plan;
        PREPARE audit_query AS ${query};
        EXPLAIN (FORMAT JSON) EXECUTE audit_query(${argumentsSql});
      `);
      assert.ok(plan.includes(indexNames[i]), plan);
    }
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { verifySchemaAudit };
