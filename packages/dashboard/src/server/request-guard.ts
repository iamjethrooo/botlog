import type { NextApiRequest } from 'next';

// Browser boundary for the trusted-local dashboard. This is not bot identity or
// per-procedure authorization (BBC-25). Do not trust forwarded host/origin headers.
export function guardApiRequest(req: Pick<NextApiRequest, 'headers' | 'method'>,
  res: { status(code: number): { json(body: unknown): unknown } },
  jsonMutation = true, env = process.env, authNavigation = false): boolean {
  let external: URL, internal: URL;
  try {
    external = new URL(env.NEXTAUTH_URL!);
    internal = new URL(env.API_INTERNAL_URL || env.NEXTAUTH_URL_INTERNAL || env.NEXTAUTH_URL!);
  } catch {
    res.status(503).json({ error: 'Server URL configuration unavailable' });
    return false;
  }
  const host = req.headers.host;
  if (host !== external.host && host !== internal.host) {
    res.status(403).json({ error: 'Unexpected Host' }); return false;
  }
  const origin = req.headers.origin;
  // Exact match deliberately rejects null, credentials, paths and malformed origins.
  if ((origin !== undefined && origin !== external.origin) ||
      (req.headers['sec-fetch-site'] === 'cross-site' && !authNavigation)) {
    res.status(403).json({ error: 'Foreign browser request' }); return false;
  }
  // Browser requests must target the canonical browser host. Internal bot calls
  // have no Origin or Fetch Metadata and use dashboard:3000.
  if (host !== external.host && (origin !== undefined || req.headers['sec-fetch-site'] !== undefined)) {
    res.status(403).json({ error: 'Internal host is not a browser origin' }); return false;
  }
  if (jsonMutation && !['GET', 'HEAD'].includes(req.method || '')) {
    const contentType = req.headers['content-type']?.split(';')[0]?.trim().toLowerCase();
    if (contentType !== 'application/json') {
      res.status(415).json({ error: 'Use application/json' }); return false;
    }
  }
  return true;
}
