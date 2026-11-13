// Local host startup only. Container binding/publication belongs to BBC-21.
const path = require('node:path');
const { spawn } = require('node:child_process');
const { getApiUrl } = require('../packages/node/api-url.cjs');

function localOptions(env) {
  const url = new URL(env.NEXTAUTH_URL);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' ||
      url.pathname !== '/' || url.username || url.password || url.search || url.hash) {
    throw new Error('NEXTAUTH_URL must be http://127.0.0.1:<port>');
  }
  getApiUrl(env);
  return ['--hostname', '127.0.0.1', '--port', url.port || '80'];
}

async function main() {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
  const mode = process.argv[2];
  if (!['dev', 'start'].includes(mode)) throw new Error('Expected dev or start');
  const args = localOptions(process.env);
  const dashboard = path.resolve(__dirname, '../packages/dashboard');
  const nextCli = require.resolve('next/dist/bin/next', { paths: [dashboard] });
  if (mode === 'start') {
    const { checkMigrations, reportMigrationError } = require('../docker/check-migrations.cjs');
    try {
      await checkMigrations();
    } catch (error) {
      reportMigrationError(error);
      process.exitCode = 1;
      return;
    }
  }
  const child = spawn(process.execPath, [nextCli, mode, ...args], {
    cwd: dashboard, stdio: 'inherit', env: process.env
  });
  child.on('exit', code => { process.exitCode = code ?? 1; });
  child.on('error', () => { process.exitCode = 1; });
}
if (require.main === module) main();
module.exports = { localOptions };
