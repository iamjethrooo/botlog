"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guildRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
const server_1 = require("@trpc/server");
const client_1 = require("@trpc/client");
const fetch = (0, client_1.getFetch)();
exports.guildRouter = trpc_1.t.router({
    getGuild: trpc_1.t.procedure
        .input(zod_1.z.object({
        id: zod_1.z.string()
    }))
        .query(async ({ ctx, input }) => {
        const { id } = input;
        const guild = await ctx.prisma.guild.findUnique({
            where: {
                id
            }
        });
        return { guild };
    }),
    getGuildFromAPI: trpc_1.t.procedure
        .input(zod_1.z.object({
        guildId: zod_1.z.string()
    }))
        .query(async ({ ctx, input }) => {
        const token = process.env.DISCORD_BOT_TOKEN;
        const { guildId } = input;
        if (!ctx.session) {
            throw new server_1.TRPCError({
                message: 'Not Authenticated',
                code: 'UNAUTHORIZED'
            });
        }
        try {
            const response = await fetch(`https://discord.com/api/guilds/${guildId}`, {
                headers: {
                    Authorization: `Bot ${token}`
                }
            });
            const guild = await response.json();
            return { guild };
        }
        catch {
            throw new server_1.TRPCError({
                message: 'Not Found',
                code: 'NOT_FOUND'
            });
        }
    }),
    getGuildAndUser: trpc_1.t.procedure
        .input(zod_1.z.object({
        id: zod_1.z.string()
    }))
        .query(async ({ ctx, input }) => {
        var _a, _b;
        const { id } = input;
        const guild = await ctx.prisma.guild.findUnique({
            where: {
                id
            }
        });
        const user = await ctx.prisma.user.findUnique({
            where: {
                // @ts-ignore
                id: (_b = (_a = ctx.session) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.id
            }
        });
        if ((guild === null || guild === void 0 ? void 0 : guild.ownerId) !== (user === null || user === void 0 ? void 0 : user.discordId)) {
            throw new server_1.TRPCError({
                message: 'UNAUTHORIZED',
                code: 'UNAUTHORIZED'
            });
        }
        return { guild, user };
    }),
    create: trpc_1.t.procedure
        .input(zod_1.z.object({
        id: zod_1.z.string(),
        ownerId: zod_1.z.string(),
        name: zod_1.z.string()
    }))
        .mutation(async ({ ctx, input }) => {
        const { id, ownerId, name } = input;
        const guild = await ctx.prisma.guild.upsert({
            where: {
                id: id
            },
            update: {},
            create: {
                id: id,
                ownerId: ownerId,
                volume: 100,
                name: name
            }
        });
        return { guild };
    }),
    createViaTwitchNotification: trpc_1.t.procedure
        .input(zod_1.z.object({
        guildId: zod_1.z.string(),
        userId: zod_1.z.string(),
        ownerId: zod_1.z.string(),
        name: zod_1.z.string(),
        notifyList: zod_1.z.array(zod_1.z.string())
    }))
        .mutation(async ({ ctx, input }) => {
        const { guildId, userId, ownerId, name, notifyList } = input;
        await ctx.prisma.guild.upsert({
            create: {
                id: guildId,
                notifyList: [userId],
                volume: 100,
                ownerId: ownerId,
                name: name
            },
            select: { notifyList: true },
            update: {
                notifyList
            },
            where: { id: guildId }
        });
    }),
    delete: trpc_1.t.procedure
        .input(zod_1.z.object({
        id: zod_1.z.string()
    }))
        .mutation(async ({ ctx, input }) => {
        const { id } = input;
        const guild = await ctx.prisma.guild.delete({
            where: {
                id: id
            }
        });
        return { guild };
    }),
    updateWelcomeMessage: trpc_1.t.procedure
        .input(zod_1.z.object({
        guildId: zod_1.z.string(),
        welcomeMessage: zod_1.z.string().nullable(),
        welcomeMessageEnabled: zod_1.z.boolean().nullable()
    }))
        .mutation(async ({ ctx, input }) => {
        const { guildId, welcomeMessage, welcomeMessageEnabled } = input;
        const guild = await ctx.prisma.guild.update({
            where: {
                id: guildId
            },
            data: {
                // undefined means do nothing, null will set the value to null
                welcomeMessage: welcomeMessage ? welcomeMessage : undefined,
                welcomeMessageEnabled: welcomeMessageEnabled
                    ? welcomeMessageEnabled
                    : undefined
            }
        });
        return { guild };
    }),
    toggleWelcomeMessage: trpc_1.t.procedure
        .input(zod_1.z.object({
        status: zod_1.z.boolean(),
        guildId: zod_1.z.string()
    }))
        .mutation(async ({ ctx, input }) => {
        const { status, guildId } = input;
        const guild = await ctx.prisma.guild.update({
            where: {
                id: guildId
            },
            data: {
                welcomeMessageEnabled: status
            }
        });
        return { guild };
    }),
    updateWelcomeMessageChannel: trpc_1.t.procedure
        .input(zod_1.z.object({
        guildId: zod_1.z.string(),
        channelId: zod_1.z.string()
    }))
        .mutation(async ({ ctx, input }) => {
        const { guildId, channelId } = input;
        const guild = await ctx.prisma.guild.update({
            where: {
                id: guildId
            },
            data: {
                welcomeMessageChannel: channelId
            }
        });
        return { guild };
    }),
    getAllFromLocal: trpc_1.t.procedure
        .input(zod_1.z.object({
        ownerId: zod_1.z.string()
    }))
        .query(async ({ ctx, input }) => {
        const { ownerId } = input;
        const guilds = await ctx.prisma.guild.findMany({
            where: {
                ownerId: ownerId
            }
        });
        return { guilds };
    }),
    getAll: trpc_1.t.procedure.query(async ({ ctx }) => {
        var _a, _b;
        if (!ctx.session) {
            throw new server_1.TRPCError({
                message: 'Not Authenticated',
                code: 'UNAUTHORIZED'
            });
        }
        const account = await ctx.prisma.account.findFirst({
            where: {
                // @ts-ignore
                userId: (_b = (_a = ctx.session) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.id
            },
            select: {
                access_token: true,
                providerAccountId: true
            }
        });
        if (!account || !account.access_token) {
            throw new server_1.TRPCError({
                code: 'NOT_FOUND',
                message: 'Account not found'
            });
        }
        const dbGuilds = await ctx.prisma.guild.findMany({
            where: {
                ownerId: account.providerAccountId
            }
        });
        // fetch guilds the user is owner in from discord api using the ownerId and token
        try {
            const response = await fetch(`https://discord.com/api/users/@me/guilds`, {
                headers: {
                    Authorization: `Bearer ${account.access_token}`
                }
            });
            const userGuilds = await response.json();
            if (!userGuilds.length) {
                return { guilds: dbGuilds };
            }
            const guildsUserOwns = userGuilds.filter(guild => guild.owner);
            return { apiGuilds: guildsUserOwns, dbGuilds };
        }
        catch (e) {
            console.error(e);
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Something went wrong when trying to fetch guilds'
            });
        }
    }),
    getAllFromDiscordAPI: trpc_1.t.procedure.query(async ({ ctx }) => {
        var _a, _b;
        if (!ctx.session) {
            throw new server_1.TRPCError({
                message: 'Not Authenticated',
                code: 'UNAUTHORIZED'
            });
        }
        const account = await ctx.prisma.account.findFirst({
            where: {
                // @ts-ignore
                userId: (_b = (_a = ctx.session) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.id
            },
            select: {
                access_token: true,
                providerAccountId: true,
                user: {
                    select: {
                        discordId: true
                    }
                }
            }
        });
        if (!account || !account.access_token) {
            throw new server_1.TRPCError({
                code: 'NOT_FOUND',
                message: 'Account not found'
            });
        }
        const response = await fetch(`https://discord.com/api/users/@me/guilds`, {
            headers: {
                Authorization: `Bearer ${account.access_token}`
            }
        });
        const userGuilds = await response.json();
        return { guilds: userGuilds, discordId: account.user.discordId };
    }),
    updateTwitchNotifications: trpc_1.t.procedure
        .input(zod_1.z.object({
        guildId: zod_1.z.string(),
        notifyList: zod_1.z.array(zod_1.z.string())
    }))
        .mutation(async ({ ctx, input }) => {
        const { guildId, notifyList } = input;
        await ctx.prisma.guild.update({
            where: { id: guildId },
            data: { notifyList }
        });
    }),
    updateVolume: trpc_1.t.procedure
        .input(zod_1.z.object({
        guildId: zod_1.z.string(),
        volume: zod_1.z.number()
    }))
        .mutation(async ({ ctx, input }) => {
        const { guildId, volume } = input;
        await ctx.prisma.guild.update({
            where: { id: guildId },
            data: { volume }
        });
    }),
    getRoles: trpc_1.t.procedure
        .input(zod_1.z.object({
        guildId: zod_1.z.string()
    }))
        .query(async ({ ctx, input }) => {
        const { guildId } = input;
        const token = process.env.DISCORD_TOKEN;
        if (!ctx.session) {
            throw new server_1.TRPCError({
                message: 'Not Authenticated',
                code: 'UNAUTHORIZED'
            });
        }
        const response = await fetch(`https://discord.com/api/guilds/${guildId}/roles`, {
            headers: {
                Authorization: `Bot ${token}`
            }
        });
        const roles = await response.json();
        return { roles };
    })
});
//# sourceMappingURL=guild.js.map