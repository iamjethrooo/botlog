import { t } from "../trpc";
import { z } from "zod";
import { ChannelType, type APIGuild, type APIRole, type RESTGetAPICurrentUserGuildsResult } from "discord-api-types/v10";
import { TRPCError } from "@trpc/server";
import { discordRequest } from "../discord";
import { managedGuilds, requireGuildManager } from "../guildAccess";
import { channelFeatureSettings, checkChannelFeatureHealth, fetchGuildChannels } from "../guildFeatureHealth";
import { economyInteger } from "../economy";

const snowflake = z.string().regex(/^\d{17,20}$/);
const welcomeSettings = {
  welcomeMessageEnabled: true,
  welcomeMessageChannel: true,
  welcomeMessage: true,
} as const;

async function welcomeChannels(guildId: string) {
  const channels = await fetchGuildChannels(guildId);
  return channels.flatMap(channel =>
    channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement
      ? [{ id: channel.id, name: channel.name }]
      : []
  );
}

function withLegacyOwnerId<T extends { ownerDiscordId: string }>(guild: T) {
  return { ...guild, ownerId: guild.ownerDiscordId };
}

export const guildRouter = t.router({
  getChannelFeatureHealth: t.procedure
    .input(z.object({ guildId: snowflake }))
    .query(async ({ ctx, input: { guildId } }) => {
      await requireGuildManager(ctx, guildId);
      const settings = await ctx.prisma.guild.findUnique({
        where: { id: guildId }, select: channelFeatureSettings,
      });
      if (!settings) throw new TRPCError({ code: "NOT_FOUND", message: "Server settings are unavailable" });
      return checkChannelFeatureHealth(guildId, settings);
    }),
  getWelcomeSettings: t.procedure
    .input(z.object({ guildId: snowflake }))
    .query(async ({ ctx, input: { guildId } }) => {
      await requireGuildManager(ctx, guildId);
      const [settings, channels] = await Promise.all([
        ctx.prisma.guild.findUnique({ where: { id: guildId }, select: welcomeSettings }),
        welcomeChannels(guildId),
      ]);
      if (!settings) throw new TRPCError({ code: "NOT_FOUND", message: "Server settings are unavailable" });
      return { settings, channels };
    }),
  updateWelcomeSettings: t.procedure
    .input(z.object({
      guildId: snowflake,
      enabled: z.boolean(),
      channelId: snowflake.nullable(),
      message: z.string().trim().max(2000),
    }))
    .mutation(async ({ ctx, input: { guildId, enabled, channelId, message } }) => {
      await requireGuildManager(ctx, guildId);
      const channels = await welcomeChannels(guildId);
      if ((channelId && !channels.some(channel => channel.id === channelId)) ||
        (enabled && (!channelId || !message))) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a server text channel and enter a welcome message." });
      }
      const settings = await ctx.prisma.guild.update({
        where: { id: guildId },
        select: welcomeSettings,
        data: {
          welcomeMessageEnabled: enabled,
          welcomeMessageChannel: channelId,
          welcomeMessage: message || null,
        },
      });
      return { settings, channels };
    }),
  getGuild: t.procedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { id } = input;

      const guild = await ctx.prisma.guild.findUnique({
        where: {
          id,
        },
      });

      return { guild: guild && withLegacyOwnerId(guild) };
    }),
  getGuildFromAPI: t.procedure
    .input(
      z.object({
        guildId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const token = process.env.DISCORD_BOT_TOKEN;
      const { guildId } = input;
      await requireGuildManager(ctx, guildId);

      const guild = await discordRequest<APIGuild>(`https://discord.com/api/v10/guilds/${guildId}`,
        { headers: { Authorization: `Bot ${token}` } }, "Fetching guild");
      return { guild };
    }),
  getGuildAndUser: t.procedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { id } = input;

      await requireGuildManager(ctx, id);
      const guild = await ctx.prisma.guild.findUnique({
        where: {
          id,
        },
      });

      const user = await ctx.prisma.user.findUnique({
        where: {
          // @ts-ignore
          id: ctx.session?.user?.id,
        },
      });

      return { guild: guild && withLegacyOwnerId(guild), user };
    }),
  create: t.procedure
    .input(
      z.object({
        id: z.string(),
        ownerId: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ownerId, name } = input;

      const guild = await ctx.prisma.guild.upsert({
        where: {
          id: id,
        },
        update: {},
        create: {
          id: id,
          ownerDiscordId: ownerId,
          volume: 100,
          name: name,
        },
      });

      return { guild: withLegacyOwnerId(guild) };
    }),
  createViaTwitchNotification: t.procedure
    .input(
      z.object({
        guildId: z.string(),
        userId: z.string(),
        ownerId: z.string(),
        name: z.string(),
        notifyList: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { guildId, userId, ownerId, name, notifyList } = input;
      await ctx.prisma.guild.upsert({
        create: {
          id: guildId,
          notifyList: [userId],
          volume: 100,
          ownerDiscordId: ownerId,
          name: name,
        },
        select: { notifyList: true },
        update: {
          notifyList,
        },
        where: { id: guildId },
      });
    }),
  delete: t.procedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      const guild = await ctx.prisma.guild.delete({
        where: {
          id: id,
        },
      });

      return { guild: withLegacyOwnerId(guild) };
    }),
  getAllFromLocal: t.procedure
    .input(
      z.object({
        ownerId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { ownerId } = input;

      const guilds = await ctx.prisma.guild.findMany({
        where: {
          ownerDiscordId: ownerId,
        },
      });

      return { guilds: guilds.map(withLegacyOwnerId) };
    }),
  getAll: t.procedure.query(async ({ ctx }) => {
    const { guilds } = await managedGuilds(ctx);
    if (guilds.length === 0) return { apiGuilds: [], dbGuilds: [] };

    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Discord bot token is not configured" });
    }

    const remainingGuildIds = new Set(guilds.map(guild => guild.id));
    const pageSize = 200;
    const url = new URL("https://discord.com/api/v10/users/@me/guilds");
    url.searchParams.set("limit", String(pageSize));
    while (remainingGuildIds.size > 0) {
      const page = await discordRequest<RESTGetAPICurrentUserGuildsResult>(
        url.toString(),
        { headers: { Authorization: `Bot ${token}` } },
        "Fetching the bot's servers",
      );
      for (const guild of page) remainingGuildIds.delete(guild.id);
      if (page.length < pageSize) break;
      url.searchParams.set("after", page[page.length - 1]!.id);
    }

    const apiGuilds = guilds.filter(guild => !remainingGuildIds.has(guild.id));
    if (apiGuilds.length === 0) return { apiGuilds, dbGuilds: [] };

    const dbGuilds = await ctx.prisma.guild.findMany({
      where: {
        id: { in: apiGuilds.map(guild => guild.id) },
      },
      select: { id: true },
    });
    return { apiGuilds, dbGuilds };
  }),
  getRecentActivity: t.procedure
    .input(z.object({ guildId: z.string().regex(/^\d{17,20}$/) }))
    .query(async ({ ctx, input: { guildId } }) => {
      await requireGuildManager(ctx, guildId);
      await discordRequest<APIGuild>(
        `https://discord.com/api/v10/guilds/${guildId}`,
        { headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` } },
        "Checking bot server membership"
      );
      return ctx.prisma.dashboardActivity.findMany({
        where: { guildId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 25,
      });
    }),
  getAllFromDiscordAPI: t.procedure.query(async ({ ctx }) => {
    if (!ctx.session) {
      throw new TRPCError({
        message: "Not Authenticated",
        code: "UNAUTHORIZED",
      });
    }

    const account = await ctx.prisma.account.findFirst({
      where: {
        // @ts-ignore
        userId: ctx.session?.user?.id,
      },
      select: {
        access_token: true,
        providerAccountId: true,
        user: {
          select: {
            discordId: true,
          },
        },
      },
    });

    if (!account || !account.access_token) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Account not found",
      });
    }

    const userGuilds = await discordRequest<APIGuild[]>("https://discord.com/api/v10/users/@me/guilds",
      { headers: { Authorization: `Bearer ${account.access_token}` } }, "Fetching your guilds");

    return { guilds: userGuilds, discordId: account.user.discordId };
  }),
  updateTwitchNotifications: t.procedure
    .input(
      z.object({
        guildId: z.string(),
        notifyList: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { guildId, notifyList } = input;

      await ctx.prisma.guild.update({
        where: { id: guildId },
        data: { notifyList },
      });
    }),
  updateVolume: t.procedure
    .input(
      z.object({
        guildId: z.string(),
        volume: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { guildId, volume } = input;

      await ctx.prisma.guild.update({
        where: { id: guildId },
        data: { volume },
      });
    }),
  getRoles: t.procedure
    .input(
      z.object({
        guildId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { guildId } = input;
      const token = process.env.DISCORD_TOKEN;

      if (!ctx.session) {
        throw new TRPCError({
          message: "Not Authenticated",
          code: "UNAUTHORIZED",
        });
      }

      const roles = await discordRequest<APIRole[]>(`https://discord.com/api/v10/guilds/${guildId}/roles`,
        { headers: { Authorization: `Bot ${token}` } }, "Fetching guild roles");

      return { roles };
    }),
  addToBank: t.procedure
    .input(
      z.object({
        id: z.string(),
        amount: economyInteger,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, amount } = input;

      const guildMoney = await ctx.prisma.guild.update({
        where: {
          id: id,
        },
        data: { bank: { increment: amount } },
      });

      return { guildMoney: withLegacyOwnerId(guildMoney) };
    }),
  subtractFromBank: t.procedure
    .input(
      z.object({
        id: z.string(),
        amount: economyInteger,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, amount } = input;

      const guildMoney = await ctx.prisma.guild.update({
        where: {
          id: id,
        },
        data: { bank: { decrement: amount } },
      });

      return { guildMoney: withLegacyOwnerId(guildMoney) };
    }),
  setBankBalance: t.procedure
    .input(
      z.object({
        id: z.string(),
        amount: economyInteger,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, amount } = input;

      const guildMoney = await ctx.prisma.guild.update({
        where: {
          id: id,
        },
        data: { bank: amount },
      });

      return { guildMoney: withLegacyOwnerId(guildMoney) };
    }),
  addToThievesBank: t.procedure
    .input(
      z.object({
        id: z.string(),
        amount: economyInteger,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, amount } = input;

      const guildMoney = await ctx.prisma.guild.update({
        where: {
          id: id,
        },
        data: { thievesBank: { increment: amount } },
      });

      return { guildMoney: withLegacyOwnerId(guildMoney) };
    }),
});
