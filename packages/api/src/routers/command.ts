import { t } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type {
  APIGuildChannel,
  APIRole,
  ChannelType,
} from "discord-api-types/v10";
import { discordRequest } from "../discord";
import { requireGuildManager } from "../guildAccess";
import { dashboardSettingsTransaction, recordDashboardActivity, roleRulesForActivity } from "../dashboardActivity";

import {
  availableCommands, commandDiscord, commandPath, commandPermissions, discordApi as api, resolveCommand
} from '../commandManagement';
import type { CommandType, CommandPermissionsResponseOkay } from '../commandManagement';
import { commandPermissionPayload } from '../commandPermissions';
export type { CommandType, CommandPermissionsResponseOkay, CommandPermissionsResponseNotOkay } from '../commandManagement';

// Only these registered commands run the bot's isCommandDisabled precondition.
const toggleableCommands = new Set([
  "bassboost", "karaoke", "leave", "lyrics", "move", "nightcore",
  "pause", "play", "queue", "remove", "resume", "seek", "shuffle",
  "skip", "skipto", "summon", "vaporwave", "volume",
]);

export const commandRouter = t.router({
  getDisabledCommands: t.procedure
    .input(
      z.object({
        guildId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { guildId } = input;

      const guild = await ctx.prisma.guild.findUnique({
        where: {
          id: guildId,
        },
        select: {
          disabledCommands: true,
        },
      });

      if (!guild) {
        throw new TRPCError({
          message: "Guild not found",
          code: "NOT_FOUND",
        });
      }

      return { disabledCommands: guild.disabledCommands };
    }),
  getCommands: t.procedure
    .input(
      z.object({
        guildId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      await requireGuildManager(ctx, input.guildId);
      const commands = await availableCommands(input.guildId, commandDiscord());
      return { commands: commands.map(command => ({
        ...command,
        toggleSupported: command.type === 1 && toggleableCommands.has(command.name),
      })) };
    }),
  getCommandAndGuildChannels: t.procedure
    .input(
      z.object({
        guildId: z.string(),
        commandId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const token = process.env.DISCORD_TOKEN;
      const clientID = process.env.DISCORD_CLIENT_ID;
      const { guildId, commandId } = input;

      const accessToken = await requireGuildManager(ctx, guildId);

      const discord = commandDiscord();
      const registered = await resolveCommand(guildId, commandId, discord);
      const resolvedPath = commandPath(guildId, registered);
      const [channels, roles, command, permissions] = await Promise.all([
        discordRequest<APIGuildChannel<ChannelType>[]>(`${api}/guilds/${guildId}/channels`,
          { headers: { Authorization: `Bot ${token}` } }, "Fetching guild channels"),
        discordRequest<APIRole[]>(`${api}/guilds/${guildId}/roles`,
          { headers: { Authorization: `Bot ${token}` } }, "Fetching guild roles"),
        discordRequest<CommandType>(`${api}/applications/${clientID}/${resolvedPath}`,
          { headers: { Authorization: `Bot ${token}` } }, "Fetching guild command"),
        commandPermissions(guildId, registered, accessToken, discord),
      ]);
      return { channels, roles, command, permissions };
    }),
  getCommandPermissions: t.procedure
    .input(
      z.object({
        guildId: z.string(),
        commandId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { guildId, commandId } = input;

      const accessToken = await requireGuildManager(ctx, guildId);
      const discord = commandDiscord();
      const registered = await resolveCommand(guildId, commandId, discord);
      const command = await commandPermissions(guildId, registered, accessToken, discord);
      return { command };
    }),
  editCommandPermissions: t.procedure
    .input(
      z.object({
        guildId: z.string(),
        commandId: z.string(),
        permissions: z.array(
          z.object({
            id: z.string(),
            type: z.number(),
            permission: z.boolean(),
          })
        ),
        type: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const clientID = process.env.DISCORD_CLIENT_ID;
      const { guildId, commandId, permissions, type } = input;
      const accessToken = await requireGuildManager(ctx, guildId);

      const discord = commandDiscord();
      const registered = await resolveCommand(guildId, commandId, discord);
      const current = await commandPermissions(guildId, registered, accessToken, discord);
      const payload = commandPermissionPayload(guildId, type, permissions, current.permissions);
      const command = await discordRequest<CommandPermissionsResponseOkay>(
        `${api}/applications/${clientID}/guilds/${guildId}/commands/${commandId}/permissions`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        "Updating command permissions"
      );
      const before = roleRulesForActivity(current.permissions);
      const after = roleRulesForActivity(command?.permissions ?? payload.permissions);
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        try {
          await recordDashboardActivity(ctx.prisma, ctx.session, guildId, {
            kind: 'COMMAND_PERMISSIONS',
            commandName: registered.type === 1 ? `/${registered.name}` : registered.name,
            before, after
          });
        } catch {
          // Discord already committed the change, so report the logging failure
          // separately. Retrying the whole mutation would issue another PUT.
          return { command, activityRecorded: false as const };
        }
      }
      return { command };
    }),

  toggleCommand: t.procedure
    .input(
      z.object({
        guildId: z.string(),
        commandId: z.string(),
        status: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { guildId, commandId, status } = input;

      await requireGuildManager(ctx, guildId);
      const command = await resolveCommand(guildId, commandId, commandDiscord(), "Command is not registered in this guild");
      if (command.type !== 1 || !toggleableCommands.has(command.name)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The bot does not support dashboard toggles for this command" });
      }

      return dashboardSettingsTransaction(ctx.prisma, async tx => {
        const guild = await tx.guild.findUnique({ where: { id: guildId } });
        if (!guild) throw new TRPCError({ message: 'Guild not found', code: 'NOT_FOUND' });

        const wasDisabled = guild.disabledCommands.includes(commandId);
        if (wasDisabled === status) return { updatedGuild: guild };

        const disabledCommands = status ? [...guild.disabledCommands, commandId] :
          guild.disabledCommands.filter(id => id !== commandId);
        const updatedGuild = await tx.guild.update({
          where: { id: guildId },
          data: { disabledCommands: { set: disabledCommands } },
        });
        await recordDashboardActivity(tx, ctx.session, guildId, {
          kind: 'COMMAND_TOGGLE', commandName: `/${command.name}`,
          before: { enabled: !wasDisabled }, after: { enabled: !status }
        });
        return { updatedGuild };
      });
    }),
});
