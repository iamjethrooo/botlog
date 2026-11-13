// Synthetic data only. Both database names are created in this temporary cluster.
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const { createHash, randomBytes } = require('node:crypto');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { performance } = require('node:perf_hooks');

const root = path.resolve(__dirname, '..');
const bin = process.env.BOTLOG_POSTGRES_BIN || 'C:/Program Files/PostgreSQL/15/bin';
const role = 'botlog_rehearsal';
const checkSql = path.join(__dirname, 'postgres-recovery-check.sql');
const pgEnvironment = Object.fromEntries(Object.entries(process.env)
  .filter(([key]) => !key.toUpperCase().startsWith('PG')));

async function getPort() {
  const socket = net.createServer();
  await new Promise((resolve, reject) => {
    socket.once('error', reject);
    socket.listen(0, '127.0.0.1', resolve);
  });
  const { port } = socket.address();
  await new Promise((resolve, reject) => socket.close(error => error ? reject(error) : resolve()));
  return port;
}

function hashFile(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

async function main() {
  const port = await getPort();
  const tempRoot = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(tempRoot, 'botlog-pg-recovery-'));
  const cluster = path.join(dir, 'cluster');
  const archive = path.join(dir, 'rehearsal.dump');
  const password = randomBytes(24).toString('hex');
  const passwordFile = path.join(dir, 'init-password');
  const run = (name, args, options = {}) => {
    try {
      return execFileSync(path.join(bin, process.platform === 'win32' ? name + '.exe' : name), args, {
        encoding: 'utf8', env: pgEnvironment, timeout: 60000, windowsHide: true, ...options,
      });
    } catch (error) {
      throw new Error(`${name} failed: ${error.stderr?.trim() || error.code || error.status}`);
    }
  };
  const connection = database => ['-w', '-h', '127.0.0.1', '-p', String(port), '-U', role, '-d', database];
  const psql = (database, ...args) => run('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', ...connection(database), ...args]);
  const dump = (database, ...args) => run('pg_dump', [...connection(database), '--no-owner', '--no-acl', ...args]);
  const schema = database => dump(database, '--schema-only')
    .replace(/^\\(?:un)?restrict .*\r?\n/gm, '');
  let started = false;
  try {
    fs.writeFileSync(passwordFile, password + '\n', { mode: 0o600 });
    run('initdb', ['-D', cluster, '-U', role, '--auth=scram-sha-256', '--no-locale', '-E', 'UTF8', '--pwfile', passwordFile]);
    fs.unlinkSync(passwordFile);
    started = true;
    // On Windows, the server must not inherit pg_ctl's output pipes.
    run('pg_ctl', ['-D', cluster, '-l', path.join(dir, 'server.log'), '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start'],
      { stdio: 'ignore' });
    pgEnvironment.PGPASSWORD = password;
    psql('postgres', '-c', 'CREATE DATABASE rehearsal_source', '-c', 'CREATE DATABASE rehearsal_restore');

    const prismaDir = path.join(dir, 'prisma');
    fs.mkdirSync(prismaDir);
    fs.copyFileSync(path.join(root, 'prisma', 'schema.prisma'), path.join(prismaDir, 'schema.prisma'));
    fs.cpSync(path.join(root, 'prisma', 'migrations'), path.join(prismaDir, 'migrations'), { recursive: true });
    const env = {
      ...pgEnvironment,
      DATABASE_URL: `postgresql://${role}:${password}@127.0.0.1:${port}/rehearsal_source`,
      SHADOW_DB_URL: 'postgresql://unused:unused@127.0.0.1:1/unused',
    };
    const prisma = path.join(root, 'node_modules', 'prisma', 'build', 'index.js');
    const migrate = (command, databaseUrl) => execFileSync(process.execPath, [prisma, 'migrate', command], {
      cwd: dir, env: { ...env, DATABASE_URL: databaseUrl }, stdio: 'ignore', timeout: 60000,
    });
    const gate = databaseUrl => spawnSync(process.execPath, [path.join(root, 'docker', 'check-migrations.cjs')], {
      cwd: dir, env: { ...env, DATABASE_URL: databaseUrl }, encoding: 'utf8', timeout: 30000,
    });
    const expectGateFailure = (databaseUrl, message) => {
      const result = gate(databaseUrl);
      assert.equal(result.status, 1);
      assert.match(result.stderr, message);
    };
    expectGateFailure(env.DATABASE_URL, /Prisma migration history is missing/);
    const auditMigration = '20261114000000_schema_audit_fixes';
    const pending = path.join(dir, auditMigration);
    const migration = path.join(prismaDir, 'migrations', auditMigration);
    fs.renameSync(migration, pending);
    migrate('deploy', env.DATABASE_URL);

    psql('rehearsal_source', '-c', `
      INSERT INTO "User" (id, "discordId", cash, "failedRobAttempts", "lastRobDate", "jailTime")
          VALUES ('fixture-user', 'fixture-discord', 250, 2, '1800000000123', '45');
      INSERT INTO "Guild" (id, name, "ownerId", bank, "thievesBank") VALUES ('fixture-guild', 'Fixture', 'fixture-discord', 125, 50);
      INSERT INTO "Item" (name, "buyPrice", stock) VALUES ('Fixture item', 20, 10);
      INSERT INTO "Inventory" ("userId", "itemId", amount) VALUES ('fixture-discord', 1, 3);
      INSERT INTO "Giveaway" ("giveawayId", prize, "dateStarted", "endsAt", "entryFee")
          VALUES ('fixture-giveaway', 'Fixture prize', '1800000000', '1800000000123', '12');
      INSERT INTO "GiveawayEntry" ("giveawayId", "userId") VALUES ('fixture-giveaway', 'fixture-discord'), ('fixture-giveaway', 'fixture-discord');
      INSERT INTO "Giveaway" ("giveawayId", prize, "dateStarted", "endsAt", "entryFee")
          VALUES ('unreadable-giveaway', 'Legacy prize', '', 'bad-time', '-1');
      INSERT INTO "Reminder" (event, "dateTime", "userId", "timeOffset") VALUES
          ('explicit-offset', '2027-01-15T16:00:00+08:00', 'fixture-discord', 8),
          ('invalid-date', '2027-02-30T16:00:00Z', 'fixture-discord', 0),
          ('unknown-format', 'someday', 'fixture-discord', 0);
      INSERT INTO "Item" (name, "buyPrice") VALUES ('FaKe ID', 1), ('fake id', 1);
      SELECT setval('"Item_id_seq"', 20, true);
    `);
    fs.renameSync(pending, migration);
    migrate('deploy', env.DATABASE_URL);
    assert.equal(psql('rehearsal_source', '-c', `
      SELECT extract(epoch FROM "lastRobAt"), "lastHeistAt" IS NULL, "jailDurationSeconds" FROM "User";
      SELECT extract(epoch FROM "startedAt"), extract(epoch FROM "endsAtTimestamp"), "entryFeeCoins"
        FROM "Giveaway" WHERE "giveawayId" = 'fixture-giveaway';
      SELECT "startedAt" IS NULL, "endsAtTimestamp" IS NULL, "entryFeeCoins" IS NULL
        FROM "Giveaway" WHERE "giveawayId" = 'unreadable-giveaway';
      SELECT extract(epoch FROM "scheduledAt") FROM "Reminder" WHERE event = 'explicit-offset';
      SELECT count(*) FROM "Reminder" WHERE "scheduledAt" IS NULL;
      SELECT count(*) FROM "Guild" WHERE "notifyList" = '{}' AND disabled_commands = '{}';
      SELECT id FROM "Item" WHERE "systemKey" = 'FAKE_ID';
    `).trim().replace(/\r\n/g, '\n'), '1800000000.123000|t|45\n1800000000.000000|1800000000.123000|12\nt|t|t\n1800000000.000000\n2\n1\n2');
    const sourceManifest = psql('rehearsal_source', '-f', checkSql);
    assert.match(sourceManifest, /table _prisma_migrations\|[1-9]/);

    const backupStart = performance.now();
    dump('rehearsal_source', '--format=custom', '--file', archive);
    const backupMs = Math.round(performance.now() - backupStart);
    const archiveHash = hashFile(archive);
    assert.match(run('pg_restore', ['--list', archive]), /TABLE DATA public _prisma_migrations/);
    assert.equal(hashFile(archive), archiveHash);
    const restoreStart = performance.now();
    run('pg_restore', [...connection('rehearsal_restore'), '--exit-on-error', '--single-transaction',
      '--no-owner', '--no-acl', archive]);
    const restoreMs = Math.round(performance.now() - restoreStart);

    const verifyStart = performance.now();
    assert.ok(schema('rehearsal_restore') === schema('rehearsal_source'), 'Restored schema differs');
    assert.ok(psql('rehearsal_restore', '-f', checkSql) === sourceManifest, 'Restored row or sequence manifest differs');
    const restoreUrl = env.DATABASE_URL.replace(/rehearsal_source$/, 'rehearsal_restore');
    migrate('status', restoreUrl);
    assert.equal(gate(restoreUrl).status, 0);
    assert.equal(psql('rehearsal_restore', '-c', `
      SELECT u.cash, g.bank, i.amount FROM "User" u
      JOIN "Guild" g ON g."ownerId" = u."discordId"
      JOIN "Inventory" i ON i."userId" = u."discordId";
    `).trim(), '250|125|3');
    assert.equal(psql('rehearsal_restore', '-c', `SELECT nextval('"Item_id_seq"')`).trim(), '21');
    const expectConstraintFailure = (sql, constraint) => {
      assert.throws(() => psql('rehearsal_restore', '-c', sql), new RegExp(constraint));
    };
    expectConstraintFailure('UPDATE "Inventory" SET amount = -1', 'Inventory_amount_nonnegative');
    expectConstraintFailure('UPDATE "Item" SET "buyPrice" = -1', 'Item_buyPrice_nonnegative');
    expectConstraintFailure('UPDATE "Giveaway" SET "entryFeeCoins" = -1', 'Giveaway_entryFeeCoins_check');
    expectConstraintFailure('UPDATE "Guild" SET "notifyList" = NULL', 'not-null constraint');
    psql('rehearsal_restore', '-c', `
      UPDATE "Inventory" SET amount = 0;
      UPDATE "Item" SET stock = -2, "buyPrice" = 0;
      UPDATE "User" SET cash = -1;
      UPDATE "Guild" SET bank = -1, "thievesBank" = -1;
    `);
    await require('./schema-audit-fixture.cjs').verifySchemaAudit(restoreUrl, sql => psql('rehearsal_restore', '-c', sql));
    psql('rehearsal_restore', '-c', `
      UPDATE "_prisma_migrations" SET finished_at = NULL
      WHERE migration_name = (SELECT max(migration_name) FROM "_prisma_migrations");
    `);
    expectGateFailure(restoreUrl, /unfinished migration/);
    psql('rehearsal_restore', '-c', 'UPDATE "_prisma_migrations" SET rolled_back_at = now() WHERE finished_at IS NULL');
    expectGateFailure(restoreUrl, /Required Prisma migrations are pending/);
    const verifyMs = Math.round(performance.now() - verifyStart);
    console.log(JSON.stringify({
      postgres: run('pg_restore', ['--version']).trim(),
      archiveBytes: fs.statSync(archive).size, archiveSha256: archiveHash, backupMs, restoreMs, verifyMs,
      tablesCompared: sourceManifest.match(/^table /gm).length,
      sequencesCompared: sourceManifest.match(/^sequence /gm).length,
      result: 'Schema, data, sequence state, Prisma migration status, and representative SQL reads matched.',
      migrationGate: 'Accepted complete history and rejected missing, unfinished, and pending history.',
      economyConstraints: 'Rejected negative quantity and price while accepting zero, unlimited stock, and signed balances.',
      schemaAudit: 'Verified legacy backfills, channel ownership and cleanup, economy transactions, and cooldown query plans.',
    }, null, 2));
  } finally {
    if (started && fs.existsSync(path.join(cluster, 'postmaster.pid'))) {
      run('pg_ctl', ['-D', cluster, '-m', 'fast', '-w', 'stop']);
    }
    const resolved = fs.realpathSync(dir);
    assert.equal(path.dirname(resolved), tempRoot);
    assert.equal(resolved, dir);
    fs.rmSync(resolved, { recursive: true });
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
