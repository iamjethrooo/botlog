"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commandRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
const server_1 = require("@trpc/server");
const client_1 = require("@trpc/client");
const fetch = (0, client_1.getFetch)();
exports.commandRouter = trpc_1.t.router({
    getDisabledCommands: trpc_1.t.procedure
        .input(zod_1.z.object({
        guildId: zod_1.z.string()
    }))
        .query(async ({ ctx, input }) => {
        const { guildId } = input;
        const guild = await ctx.prisma.guild.findUnique({
            where: {
                id: guildId
            },
            select: {
                disabledCommands: true
            }
        });
        if (!guild) {
            throw new server_1.TRPCError({
                message: 'Guild not found',
                code: 'NOT_FOUND'
            });
        }
        return { disabledCommands: guild.disabledCommands };
    }),
    getCommands: trpc_1.t.procedure
        .input(zod_1.z.object({
        guildId: zod_1.z.string()
    }))
        .query(async ({}) => {
        try {
            const token = process.env.DISCORD_TOKEN;
            const response = await fetch(`https://discordapp.com/api/applications/${process.env.DISCORD_CLIENT_ID}/commands`, {
                headers: {
                    Authorization: `Bot ${token}`
                }
            });
            const commands = await response.json();
            return { commands };
        }
        catch (e) {
            console.error(e);
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Something went wrong when trying to fetch guilds'
            });
        }
    }),
    getCommandAndGuildChannels: trpc_1.t.procedure
        .input(zod_1.z.object({
        guildId: zod_1.z.string(),
        commandId: zod_1.z.string()
    }))
        .query(async ({ ctx, input }) => {
        var _a, _b;
        if (!ctx.session) {
            throw new server_1.TRPCError({
                message: 'Not Authenticated',
                code: 'UNAUTHORIZED'
            });
        }
        const token = process.env.DISCORD_TOKEN;
        const clientID = process.env.DISCORD_CLIENT_ID;
        const { guildId, commandId } = input;
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
        try {
            const [guildChannelsResponse, guildRolesResponse, commandResponse, permissionsResponse] = await Promise.all([
                fetch(`https://discord.com/api/guilds/${guildId}/channels`, {
                    headers: {
                        Authorization: `Bot ${token}`
                    }
                }).then((res) => res.json()),
                fetch(`https://discord.com/api/guilds/${guildId}/roles`, {
                    headers: {
                        Authorization: `Bot ${token}`
                    }
                }).then((res) => res.json()),
                fetch(`https://discord.com/api/applications/${clientID}/commands/${commandId}`, {
                    headers: {
                        Authorization: `Bot ${token}`
                    }
                }).then((res) => res.json()),
                fetch(`https://discord.com/api/applications/${clientID}/guilds/${guildId}/commands/${commandId}/permissions`, {
                    headers: {
                        Authorization: `Bearer ${account === null || account === void 0 ? void 0 : account.access_token}`
                    }
                }).then((res) => res.json())
            ]);
            const channels = guildChannelsResponse;
            const roles = guildRolesResponse;
            const command = commandResponse;
            const permissions = permissionsResponse;
            return { channels, roles, command, permissions };
        }
        catch {
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Something went wrong when trying to fetch guilds'
            });
        }
    }),
    getCommandPermissions: trpc_1.t.procedure
        .input(zod_1.z.object({
        guildId: zod_1.z.string(),
        commandId: zod_1.z.string()
    }))
        .query(async ({ ctx, input }) => {
        var _a, _b;
        const clientID = process.env.DISCORD_CLIENT_ID;
        const { guildId, commandId } = input;
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
        try {
            const response = await fetch(`https://discord.com/api/applications/${clientID}/guilds/${guildId}/commands/${commandId}/permissions`, {
                headers: {
                    Authorization: `Bearer ${account === null || account === void 0 ? void 0 : account.access_token}`
                }
            });
            const command = await response.json();
            if (!command)
                throw new Error();
            return { command };
        }
        catch {
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Something went wrong when trying to fetch guilds'
            });
        }
    }),
    editCommandPermissions: trpc_1.t.procedure
        .input(zod_1.z.object({
        guildId: zod_1.z.string(),
        commandId: zod_1.z.string(),
        permissions: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            type: zod_1.z.number(),
            permission: zod_1.z.boolean()
        })),
        type: zod_1.z.string()
    }))
        .mutation(async ({ ctx, input }) => {
        var _a, _b;
        const clientID = process.env.DISCORD_CLIENT_ID;
        const { guildId, commandId, permissions, type } = input;
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
        let everyone = {
            id: guildId,
            type: 1,
            permission: type === 'allow' ? true : false
        };
        try {
            const response = await fetch(`https://discord.com/api/applications/${clientID}/guilds/${guildId}/commands/${commandId}/permissions`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${account === null || account === void 0 ? void 0 : account.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ permissions: [everyone, ...permissions] })
            });
            const command = await response.json();
            if (!command)
                throw new Error();
            return { command };
        }
        catch {
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Something went wrong when trying to fetch guilds'
            });
        }
    }),
    toggleCommand: trpc_1.t.procedure
        .input(zod_1.z.object({
        guildId: zod_1.z.string(),
        commandId: zod_1.z.string(),
        status: zod_1.z.boolean()
    }))
        .mutation(async ({ ctx, input }) => {
        const { guildId, commandId, status } = input;
        const guild = await ctx.prisma.guild.findUnique({
            where: {
                id: guildId
            },
            select: {
                disabledCommands: true
            }
        });
        if (!guild) {
            throw new server_1.TRPCError({
                message: 'Guild not found',
                code: 'NOT_FOUND'
            });
        }
        let updatedGuild;
        if (status) {
            updatedGuild = await ctx.prisma.guild.update({
                where: {
                    id: guildId
                },
                data: {
                    disabledCommands: {
                        set: [...guild === null || guild === void 0 ? void 0 : guild.disabledCommands, commandId]
                    }
                }
            });
        }
        else {
            updatedGuild = await ctx.prisma.guild.update({
                where: {
                    id: guildId
                },
                data: {
                    disabledCommands: {
                        set: guild === null || guild === void 0 ? void 0 : guild.disabledCommands.filter(cid => cid !== commandId)
                    }
                }
            });
        }
        return { updatedGuild };
    })
});
//# sourceMappingURL=command.js.map