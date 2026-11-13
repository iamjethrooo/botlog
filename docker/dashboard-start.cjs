const { requireEnv } = require('./runtime.cjs');
const { checkMigrations, reportMigrationError } = require('./check-migrations.cjs');
requireEnv(process.env, ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL',
  'DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_TOKEN']);
const origin = new URL(process.env.NEXTAUTH_URL);
if (origin.protocol !== 'http:' || origin.hostname !== '127.0.0.1' ||
    origin.pathname !== '/' || origin.username || origin.password || origin.search || origin.hash) {
  throw new Error('NEXTAUTH_URL must be a loopback HTTP origin');
}
const http = require('node:http');
const next = require(require.resolve('next', { paths: ['/app/packages/dashboard'] }));
const internal = new URL(process.env.API_INTERNAL_URL || process.env.NEXTAUTH_URL);
const hosts = new Set([origin.host, internal.host]);
// Next 12's CLI does not drain HTTP requests on SIGTERM. Own only the listener;
// Next still serves the existing production build, routes and API in one process.
const app = next({ dev: false, dir: '/app/packages/dashboard' });
checkMigrations().catch(error => {
  reportMigrationError(error);
  throw error;
}).then(() => app.prepare()).then(() => {
  const handle = app.getRequestHandler();
  const server = http.createServer((req, res) => {
    if (!hosts.has(req.headers.host)) { res.writeHead(403); res.end('Unexpected Host'); return; }
    void handle(req, res);
  });
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => process.exit(1), 25000);
    deadline.unref();
    server.close(() => {
      app.close().then(() => process.exit(0)).catch(() => process.exit(1));
    });
  };
  // Prisma 4's signal hook exits with 128+signal when no listener remains.
  // Keep these listeners installed while HTTP requests drain; stop is idempotent.
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
  server.listen(3000, '0.0.0.0', () => console.log('Dashboard production server ready on container port 3000'));
}).catch(() => { console.error('Dashboard production startup failed'); process.exit(1); });
