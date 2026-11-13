import NextAuth, { type NextAuthOptions } from 'next-auth';
import type {} from '../../../types/next-auth';
import DiscordProvider, { DiscordProfile } from 'next-auth/providers/discord';

// Prisma adapter for NextAuth
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@bbc-bot/api/src/db/client';
import { env } from '../../../env/server.mjs';
import { discordImage, linkDiscordIdentity } from '../../../server/discord-identity';
import { guardApiRequest } from '../../../server/request-guard';
import type { NextApiRequest, NextApiResponse } from 'next';

const perms = [
  'identify',
  'guilds',
  'email',
  'applications.commands.permissions.update'
];

const scope = perms.join(' ');

export const authOptions: NextAuthOptions = {
  theme: { colorScheme: 'dark', brandColor: '#4f46e5' },
  pages: { signIn: '/signin', error: '/signin' },
  // Include user.id on session
  callbacks: {
    async signIn({ account, profile }) {
      return linkDiscordIdentity(prisma, account, profile as DiscordProfile | undefined);
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.discordId = user.discordId;
      }
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider: 'discord', providerAccountId: user.discordId } }
      });
      if (!account || account.userId !== user.id || !account.access_token ||
          !account.expires_at || account.expires_at <= Date.now() / 1000) {
        session.error = 'DiscordTokenExpired';
      }
      return session;
    },
    redirect({ url }) {
      try {
        const target = new URL(url, env.NEXTAUTH_URL);
        if (target.origin === new URL(env.NEXTAUTH_URL).origin) return target.href;
      } catch { /* malformed callback URLs fall back to the local dashboard */ }
      return env.NEXTAUTH_URL;
    }
  },
  session: {
    strategy: 'database',
    maxAge: 60 * 60 * 24 * 6 // 6 days
  },
  // Configure one or more authentication providers
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      // Discord returns RFC 9207 `iss`; keep the installed OAuth client's issuer check.
      issuer: 'https://discord.com',
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
      authorization: {
        params: {
          scope
        }
      },
      profile(profile: DiscordProfile) {
        return {
          id: profile.id,
          name: profile.username,
          email: profile.email,
          image: discordImage(profile),
          discordId: profile.id
        };
      }
    })
    // ...add more providers here
  ]
};

const handler = NextAuth(authOptions);
export default function auth(req: NextApiRequest, res: NextApiResponse) {
  // NextAuth's own CSRF-protected form posts require urlencoded content.
  // Discord's callback can redirect to NextAuth's error route. Both are
  // top-level navigations, as is a visit to the legacy sign-in URL.
  const route = req.query.nextauth;
  const isAuthPage = Array.isArray(route) && route.length === 1 &&
    (route[0] === 'signin' || route[0] === 'error');
  const isDiscordCallback = Array.isArray(route) &&
    route.length === 2 && route[0] === 'callback' && route[1] === 'discord';
  const authNavigation = req.method === 'GET' && (isAuthPage || isDiscordCallback) &&
    req.headers.origin === undefined && req.headers['sec-fetch-mode'] === 'navigate' &&
    req.headers['sec-fetch-dest'] === 'document';
  if (!guardApiRequest(req, res, false, process.env, authNavigation)) return;
  return handler(req, res);
}
