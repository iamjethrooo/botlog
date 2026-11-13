import type { Prisma, PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import type { PermissionRule } from './commandPermissions';
import type { Context } from './createContext';

type CommandToggle = { enabled: boolean };
type RoleRules = { roles: { id: string; allowed: boolean }[] };
export type VoiceHubSettings = { hub: string | null; hubChannel: string | null };

type Change =
  | { kind: 'COMMAND_TOGGLE'; commandName: string; before: CommandToggle; after: CommandToggle }
  | { kind: 'COMMAND_PERMISSIONS'; commandName: string; before: RoleRules; after: RoleRules }
  | { kind: 'VOICE_HUB'; before: VoiceHubSettings; after: VoiceHubSettings };

export async function recordDashboardActivity(
  prisma: Pick<Prisma.TransactionClient, 'dashboardActivity'>,
  session: Context['session'],
  guildId: string,
  change: Change
) {
  const actor = session?.user;
  if (!actor?.discordId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not Authenticated' });
  }

  await prisma.dashboardActivity.create({
    data: { guildId, actorDiscordId: actor.discordId, actorName: actor.name, ...change }
  });
}

export function roleRulesForActivity(permissions: readonly PermissionRule[]): RoleRules {
  return {
    roles: permissions.filter(rule => rule.type === 1)
      .map(rule => ({ id: rule.id, allowed: rule.permission }))
      .sort((a, b) => a.id.localeCompare(b.id) || Number(a.allowed) - Number(b.allowed))
  };
}

export async function dashboardSettingsTransaction<T>(
  prisma: PrismaClient,
  operation: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  // Only retry a confirmed rollback. Discord writes stay outside this callback.
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(operation, { isolationLevel: 'Serializable' });
    } catch (error) {
      if (attempt >= 2 || (error as { code?: string })?.code !== 'P2034') throw error;
    }
  }
}
