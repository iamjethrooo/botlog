/**
 * This file contains tRPC's HTTP response handler
 */
import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '@bbc-bot/api/src/routers/index';
import { createContext } from '@bbc-bot/api/src/createContext';
import { guardApiRequest } from '../../../server/request-guard';

// export API handler
const handler = createNextApiHandler({
  router: appRouter,
  createContext
});

export default function trpc(...[req, res]: Parameters<typeof handler>) {
  if (!guardApiRequest(req, res)) return;
  return handler(req, res);
}
