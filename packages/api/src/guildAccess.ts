import { TRPCError } from '@trpc/server';
import type { RESTGetAPICurrentUserGuildsResult } from 'discord-api-types/v10';
import type { Context } from './createContext';
import { discordRequest } from './discord';

const administrator = BigInt(8);

export async function managedGuilds(ctx: Context) {
  const user = ctx.session?.user;
  if (!user?.id || !user.discordId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not Authenticated' });
  }

  const account = await ctx.prisma.account.findUnique({
    where: { provider_providerAccountId: { provider: 'discord', providerAccountId: user.discordId } },
    select: { userId: true, access_token: true },
  });
  if (account?.userId !== user.id || !account.access_token) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Discord login has expired' });
  }

  const accessToken = account.access_token;
  const guilds = await discordRequest<RESTGetAPICurrentUserGuildsResult>(
    'https://discord.com/api/v10/users/@me/guilds?limit=200',
    { headers: { Authorization: `Bearer ${accessToken}` } },
    'Fetching your guilds',
  );
  return {
    accessToken,
    guilds: guilds.filter(guild => guild.owner === true ||
      (typeof guild.permissions === 'string' && /^\d+$/.test(guild.permissions) &&
        (BigInt(guild.permissions) & administrator) === administrator)),
  };
}

export async function requireGuildManager(ctx: Context, guildId: string) {
  const { guilds, accessToken } = await managedGuilds(ctx);
  if (!guilds.some(guild => guild.id === guildId)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Server owner or Administrator permission required' });
  }
  return accessToken;
}
