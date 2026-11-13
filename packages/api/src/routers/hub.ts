import { t } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { APIGuildChannel } from "discord-api-types/v10";
import { discordRequest } from "../discord";
import { requireGuildManager } from "../guildAccess";
import { dashboardSettingsTransaction, recordDashboardActivity } from "../dashboardActivity";
import type { VoiceHubSettings } from "../dashboardActivity";
import type { Context } from "../createContext";

const api = "https://discord.com/api/v10";

async function deleteChannel(id: string, token: string) {
  try {
    await discordRequest<void>(`${api}/channels/${id}`,
      { method: "DELETE", headers: { Authorization: `Bot ${token}` } }, "Deleting hub channel");
  } catch (error) {
    // A retry may encounter a channel removed by an earlier partial attempt.
    if (!(error instanceof TRPCError && error.code === "NOT_FOUND")) throw error;
  }
}

function saveHubSettings(ctx: Context, guildId: string, before: VoiceHubSettings, after: VoiceHubSettings) {
  return dashboardSettingsTransaction(ctx.prisma, async tx => {
    const current = await tx.guild.findUnique({ where: { id: guildId } });
    if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Guild not found" });
    // A concurrent removal may have already cleared these same settings.
    if (!current.hub && !current.hubChannel && !after.hub && !after.hubChannel) return current;
    if (current.hub !== before.hub || current.hubChannel !== before.hubChannel) {
      throw new TRPCError({ code: "CONFLICT", message: "Hub settings changed during this request. Refresh and try again." });
    }

    const updatedGuild = await tx.guild.update({ where: { id: guildId }, data: after });
    await recordDashboardActivity(tx, ctx.session, guildId, { kind: 'VOICE_HUB', before, after });
    return updatedGuild;
  });
}

export const hubRouter = t.router({
  create: t.procedure
    .input(
      z.object({
        guildId: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { guildId, name } = input;
      await requireGuildManager(ctx, guildId);
      const token = process.env.DISCORD_TOKEN;

      const guild = await ctx.prisma.guild.findUnique({ where: { id: guildId }, select: { hub: true, hubChannel: true } });
      if (!guild) throw new TRPCError({ code: "NOT_FOUND", message: "Guild not found" });
      if (guild.hub || guild.hubChannel) throw new TRPCError({
        code: "CONFLICT", message: "A hub already exists or needs recovery; inspect its channels before creating another",
      });
      const headers = { Authorization: `Bot ${token}`, "Content-Type": "application/json" };
      const parent = await discordRequest<APIGuildChannel<any>>(`${api}/guilds/${guildId}/channels`,
        { method: "POST", headers, body: JSON.stringify({ name, type: 4 }) }, "Creating hub category");

      let hubChannel: APIGuildChannel<any> | undefined;
      try {
        hubChannel = await discordRequest<APIGuildChannel<any>>(`${api}/guilds/${guildId}/channels`,
          { method: "POST", headers, body: JSON.stringify({ name: "Join To Create", type: 2, parent_id: parent.id }) },
          "Creating hub voice channel");
        const updatedGuild = await saveHubSettings(ctx, guildId, guild, {
          hub: parent.id, hubChannel: hubChannel.id
        });
        return { guild: updatedGuild };
      } catch (error) {
        try {
          if (hubChannel) await deleteChannel(hubChannel.id, token as string);
          await deleteChannel(parent.id, token as string);
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR",
            message: `Hub creation failed; inspect and remove Discord channel ${hubChannel?.id ?? parent.id} and category ${parent.id} before retrying` });
        }
        throw error;
      }
    }),
  delete: t.procedure
    .input(
      z.object({
        guildId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { guildId } = input;

      await requireGuildManager(ctx, guildId);
      const token = process.env.DISCORD_TOKEN;

      const guild = await ctx.prisma.guild.findUnique({
        where: {
          id: guildId,
        },
        select: {
          hub: true,
          hubChannel: true,
        },
      });

      if (!guild) {
        throw new TRPCError({
          message: "Guild not found",
          code: "NOT_FOUND",
        });
      }

      if (!guild.hub && !guild.hubChannel) return;
      if (guild.hubChannel) await deleteChannel(guild.hubChannel, token as string);
      if (guild.hub) await deleteChannel(guild.hub, token as string);
      await saveHubSettings(ctx, guildId, guild, { hub: null, hubChannel: null });
    }),
  getTempChannel: t.procedure
    .input(
      z.object({
        guildId: z.string(),
        ownerId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { guildId, ownerId } = input;

      const tempChannel = await ctx.prisma.tempChannel.findUnique({
        where: {
          guildId_ownerDiscordId: { guildId, ownerDiscordId: ownerId },
        },
      });

      return { tempChannel: tempChannel && { ...tempChannel, ownerId: tempChannel.ownerDiscordId } };
    }),
  createTempChannel: t.procedure
    .input(
      z.object({
        guildId: z.string(),
        ownerId: z.string(),
        channelId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { guildId, ownerId, channelId } = input;

      const tempChannel = await ctx.prisma.tempChannel.upsert({
        where: { guildId_ownerDiscordId: { guildId, ownerDiscordId: ownerId } },
        update: { ownerDiscordId: ownerId },
        create: {
          guildId,
          ownerDiscordId: ownerId,
          id: channelId,
        },
      });

      return { tempChannel: { ...tempChannel, ownerId: tempChannel.ownerDiscordId } };
    }),
  deleteTempChannel: t.procedure
    .input(
      z.object({
        channelId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { channelId } = input;

      const tempChannel = await ctx.prisma.tempChannel.findUnique({
        where: { id: channelId },
      });
      if (tempChannel) await ctx.prisma.tempChannel.deleteMany({ where: { id: channelId } });

      return { tempChannel: tempChannel && { ...tempChannel, ownerId: tempChannel.ownerDiscordId } };
    }),
});
