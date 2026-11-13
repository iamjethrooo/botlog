import type { NextApiRequest, NextApiResponse } from 'next';
import { guardApiRequest } from '../../server/request-guard';

export default function live(req: NextApiRequest, res: NextApiResponse) {
  if (!guardApiRequest(req, res, false)) return;
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).end();
    return;
  }
  res.status(200).json({ live: true });
}
