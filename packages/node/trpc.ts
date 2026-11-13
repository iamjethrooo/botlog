import type { AppRouter } from '@bbc-bot/api/src/routers/index';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { getApiUrl } from './api-url.cjs';

export const trpcNode = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: getApiUrl()
    })
  ]
});
