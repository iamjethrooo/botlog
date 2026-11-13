import type { AppRouter } from '@bbc-bot/api/src/routers/index';
import { createTRPCProxyClient } from '@trpc/client';
import { httpLink } from '@trpc/client/links/httpLink';
import { getApiUrl } from '@bbc-bot/node/api-url.cjs';
import superjson from 'superjson';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { isStopping, trackWork } from './lib/lifecycle';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
// Preserve the existing fetch polyfill used by commands on older bot runtimes.
globalThis.fetch = fetch as unknown as typeof globalThis.fetch;

export const trpcNode = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpLink({
      url: getApiUrl(),
      fetch: (url, options) => {
        if (isStopping()) return Promise.reject(new Error('Bot is stopping'));
        return trackWork(fetch(url, {
          ...options, timeout: 10000
        } as import('node-fetch').RequestInit));
      }
    })
  ]
});
