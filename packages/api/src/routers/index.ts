import { t } from '../trpc';

import { userRouter } from './user';
import { guildRouter } from './guild';
import { channelRouter } from './channel';
import { welcomeRouter } from './welcome';
import { commandRouter } from './command';
import { hubRouter } from './hub';
import { reminderRouter } from './reminder';
import { itemRouter } from './item';
import { inventoryRouter } from './inventory';
import { starboardMessageRouter } from './starboardMessage';

/**
 * Create your application's root router
 * If you want to use SSG, you need export this
 * @link https://trpc.io/docs/ssg
 * @link https://trpc.io/docs/router
 */

export const appRouter = t.router({
  user: userRouter,
  guild: guildRouter,
  channel: channelRouter,
  welcome: welcomeRouter,
  command: commandRouter,
  hub: hubRouter,
  reminder: reminderRouter,
  item: itemRouter,
  inventory: inventoryRouter,
  starboardMessage: starboardMessageRouter
});

export type AppRouter = typeof appRouter;
