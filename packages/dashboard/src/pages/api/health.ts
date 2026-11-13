import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@bbc-bot/api/src/db/client';
import { guardApiRequest } from '../../server/request-guard';

export default async function health(req: NextApiRequest, res: NextApiResponse) {
  if (!guardApiRequest(req, res)) return;
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.status(405).end(); return; }
  try {
    // Only a read-only readiness probe. No application rows are read or changed.
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ ready: true });
  } catch {
    res.status(503).json({ ready: false });
  }
}
