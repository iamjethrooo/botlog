// Browser requests stay relative. Server callers use runtime-only configuration.
function getApiUrl(env = process.env) {
  const value = env.API_INTERNAL_URL || env.NEXTAUTH_URL_INTERNAL || env.NEXTAUTH_URL;
  if (!value) throw new Error('Set API_INTERNAL_URL (dashboard origin, without /api/trpc)');
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) {
    throw new Error('API_INTERNAL_URL must be an HTTP(S) origin without credentials or a path');
  }
  return `${url.origin}/api/trpc`;
}

module.exports = { getApiUrl };
