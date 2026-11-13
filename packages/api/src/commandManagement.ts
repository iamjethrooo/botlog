import { TRPCError } from '@trpc/server';
import type { APIApplicationCommandPermission } from 'discord-api-types/v10';
import { discordRequest } from './discord';

export type CommandType = {
  code: number;
  id: string;
  applicationId: string;
  version: string;
  default_permission: string;
  default_member_permissions: null | string[];
  type: number;
  name: string;
  description: string;
  dm_permission: boolean;
  options: any[];
};
export type CommandPermissionsResponseOkay = {
  id: string;
  application_id: string;
  guild_id: string;
  permissions: APIApplicationCommandPermission[];
};
export type CommandPermissionsResponseNotOkay = { message: string; code: number };
export type RegisteredCommand = CommandType & { scope: 'guild' | 'global' };
type CommandDiscord = {
  request: typeof discordRequest;
  applicationId: string | undefined;
  botToken: string | undefined;
};
export const discordApi = 'https://discord.com/api/v10';

// Read configuration per operation, as the routes did before extraction.
export function commandDiscord(): CommandDiscord {
  return { request: discordRequest, applicationId: process.env.DISCORD_CLIENT_ID, botToken: process.env.DISCORD_TOKEN };
}

export async function availableCommands(guildId: string, discord: CommandDiscord): Promise<RegisteredCommand[]> {
  const headers = { Authorization: `Bot ${discord.botToken}` };
  const [guildCommands, globalCommands] = await Promise.all([
    discord.request<CommandType[]>(`${discordApi}/applications/${discord.applicationId}/guilds/${guildId}/commands`,
      { headers }, 'Fetching guild commands'),
    discord.request<CommandType[]>(`${discordApi}/applications/${discord.applicationId}/commands`,
      { headers }, 'Fetching global commands')
  ]);
  const guildNames = new Set(guildCommands.map(command => `${command.type}:${command.name}`));
  return [
    ...guildCommands.map(command => ({ ...command, scope: 'guild' as const })),
    ...globalCommands.filter(command => !guildNames.has(`${command.type}:${command.name}`))
      .map(command => ({ ...command, scope: 'global' as const }))
  ];
}

export async function resolveCommand(
  guildId: string, commandId: string, discord: CommandDiscord,
  message = 'Command is not registered for this guild'
) {
  const registered = (await availableCommands(guildId, discord)).find(command => command.id === commandId);
  if (!registered) throw new TRPCError({ code: 'NOT_FOUND', message });
  return registered;
}

export function commandPath(guildId: string, registered: RegisteredCommand) {
  return registered.scope === 'guild' ? `guilds/${guildId}/commands/${registered.id}` : `commands/${registered.id}`;
}

export async function commandPermissions(
  guildId: string, registered: RegisteredCommand, accessToken: string, discord: CommandDiscord
): Promise<CommandPermissionsResponseOkay> {
  try {
    return await discord.request<CommandPermissionsResponseOkay>(
      `${discordApi}/applications/${discord.applicationId}/guilds/${guildId}/commands/${registered.id}/permissions`,
      { headers: { Authorization: `Bearer ${accessToken}` } }, 'Fetching command permissions'
    );
  } catch (error) {
    // Call only after resolving this registration. Only Discord 10066 means no
    // explicit overrides; a missing command or any other failure stays an error.
    if (error instanceof TRPCError && error.code === 'NOT_FOUND' &&
        (error.cause as { discordCode?: number } | undefined)?.discordCode === 10066) {
      return { id: registered.id, application_id: discord.applicationId as string, guild_id: guildId, permissions: [] };
    }
    throw error;
  }
}
