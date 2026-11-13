import type { PrismaClient } from '@prisma/client';
import type { Account } from 'next-auth';
import type { DiscordProfile } from 'next-auth/providers/discord';

// Called only by NextAuth's signIn callback, after its OAuth code/state checks
// and authenticated Discord /users/@me response. Never call with browser input.
export async function linkDiscordIdentity(
  prisma: PrismaClient, account: Account | null, profile: DiscordProfile | undefined
) {
  if (!account || account.provider !== 'discord' || account.type !== 'oauth' ||
      !profile || !/^\d{17,20}$/.test(profile.id) || account.providerAccountId !== profile.id ||
      !account.access_token || !account.expires_at || account.expires_at <= Date.now() / 1000) {
    return false;
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await prisma.$transaction(async tx => {
        const key = { provider: 'discord', providerAccountId: profile.id };
        const linked = await tx.account.findUnique({
          where: { provider_providerAccountId: key }, include: { user: true }
        });
        const existing = await tx.user.findUnique({ where: { discordId: profile.id } });
        // Neither a conflicting Account owner nor an email match can select identity.
        if (linked && (linked.user.discordId !== profile.id || linked.userId !== existing?.id)) {
          throw new Error('Discord identity conflict');
        }
        const email = profile.email?.toLowerCase() || null;
        const emailOwner = email ? await tx.user.findUnique({ where: { email } }) : null;
        if (emailOwner && emailOwner.id !== existing?.id) throw new Error('Discord email conflict');

        const user = existing || await tx.user.create({ data: {
          discordId: profile.id, name: profile.username, email,
          image: discordImage(profile), emailVerified: null
        } });
        // Existing User rows are never updated: IDs, balances, profile and relations survive.
        const tokens = {
          access_token: account.access_token, expires_at: account.expires_at,
          refresh_token: account.refresh_token, token_type: account.token_type,
          scope: account.scope
        };
        if (linked) {
          await tx.account.update({ where: { id: linked.id }, data: tokens });
        } else {
          await tx.account.create({ data: { ...key, type: 'oauth', userId: user.id, ...tokens } });
        }
      }, { isolationLevel: 'Serializable' });
      return true;
    } catch (error) {
      const code = (error as { code?: string }).code;
      if ((code === 'P2034' || code === 'P2002') && attempt < 2) continue;
      // A failed transaction grants no session; no token/profile details go to the browser.
      return false;
    }
  }
  return false;
}

export function discordImage(profile: DiscordProfile) {
  if (!profile.avatar) return null;
  const extension = profile.avatar.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${extension}`;
}
