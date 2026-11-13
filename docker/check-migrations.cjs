const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');

class MigrationCheckError extends Error {}

async function checkMigrations() {
  if (!process.env.DATABASE_URL?.trim()) throw new MigrationCheckError('DATABASE_URL is required for the migration check');
  const directory = path.join(__dirname, '../prisma/migrations');
  const expected = fs.readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(directory, entry.name, 'migration.sql')))
    .map(entry => entry.name).sort();
  if (expected.length === 0) throw new MigrationCheckError('No release migrations found');

  const prisma = new PrismaClient();
  try {
    let migrations;
    try {
      migrations = await prisma.$queryRaw`
        SELECT migration_name, finished_at IS NOT NULL AS finished
        FROM "_prisma_migrations"
        WHERE rolled_back_at IS NULL
      `;
    } catch (error) {
      if (error.code === 'P2010' && error.meta?.code === '42P01') {
        throw new MigrationCheckError('Prisma migration history is missing');
      }
      throw new MigrationCheckError('Cannot read Prisma migration history. Check database connectivity and read access');
    }

    if (migrations.some(migration => !migration.finished)) {
      throw new MigrationCheckError('Prisma migration history contains an unfinished migration');
    }
    const applied = new Set(migrations.map(migration => migration.migration_name));
    const missing = expected.filter(name => !applied.has(name));
    if (missing.length > 0) throw new MigrationCheckError(`Required Prisma migrations are pending: ${missing.join(', ')}`);
  } finally {
    await prisma.$disconnect();
  }
}

function reportMigrationError(error) {
  // Only print messages from this check. Prisma and OS errors can contain connection details.
  console.error('Dashboard migration check failed' + (error instanceof MigrationCheckError ? `: ${error.message}` : ''));
}

if (require.main === module) {
  checkMigrations().then(() => console.log('Required Prisma migrations are applied')).catch(error => {
    reportMigrationError(error);
    process.exitCode = 1;
  });
}

module.exports = { checkMigrations, reportMigrationError };
