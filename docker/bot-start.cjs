const { requireEnv, requestReady, waitFor } = require('./runtime.cjs');
requireEnv(process.env, ['DISCORD_TOKEN', 'GUILD_ID', 'API_INTERNAL_URL',
  'REDIS_HOST', 'LAVA_HOST', 'LAVA_PASS', 'LAVA_PORT', 'BOT_DATA_DIR']);
const { getApiUrl } = require('../packages/node/api-url.cjs');
getApiUrl(process.env);
// No Discord client/command registration or runtime writes until the API is ready.
waitFor(() => requestReady(process.env.API_INTERNAL_URL)).then(() => {
  require('../packages/bot/dist/index.js');
}).catch(() => {
  console.error('Bot startup: dashboard readiness timed out');
  process.exitCode = 1;
});
