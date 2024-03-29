/**
 * This file contains tRPC's HTTP response handler
 */
import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '@bbc-bot/api/src/routers/index';
import { createContext } from '@bbc-bot/api/src/createContext';

// export API handler
export default createNextApiHandler({
  router: appRouter,
  createContext
});
