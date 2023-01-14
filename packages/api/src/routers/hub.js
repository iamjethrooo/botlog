"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hubRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
const server_1 = require("@trpc/server");
const client_1 = require("@trpc/client");
const fetch = (0, client_1.getFetch)();
exports.hubRouter = trpc_1.t.router({
    create: trpc_1.t.procedure
        .input(zod_1.z.object({
        guildId: zod_1.z.string(),
        name: zod_1.z.string()
    }))
        .mutation(async ({ ctx, input }) => {
        const { guildId, name } = input;
        const token = process.env.DISCORD_TOKEN;
        let parent;
        try {
            const response = await fetch(`https://discordapp.com/api/guilds/${guildId}/channels`, {
                headers: {
                    Authorization: `Bot ${token}`,
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                body: JSON.stringify({
                    name,
                    type: 4
                })
            });
            parent = await response.json();
        }
        catch (e) {
            console.log(e);
            throw new server_1.TRPCError({
                message: 'Could not create channel',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
        let hubChannel;
        try {
            const response = await fetch(`https://discordapp.com/api/guilds/${guildId}/channels`, {
                headers: {
                    Authorization: `Bot ${token}`,
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                body: JSON.stringify({
                    name: 'Join To Create',
                    type: 2,
                    parent_id: parent.id
                })
            });
            hubChannel = await response.json();
        }
        catch {
            throw new server_1.TRPCError({
                message: 'Could not create channel',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
        const updatedGuild = await ctx.prisma.guild.update({
            where: {
                id: guildId
            },
            data: {
                hub: parent.id,
                hubChannel: hubChannel.id
            }
        });
        return {
            guild: updatedGuild
        };
    }),
    delete: trpc_1.t.procedure
        .input(zod_1.z.object({
        guildId: zod_1.z.string()
    }))
        .mutation(async ({ ctx, input }) => {
        const { guildId } = input;
        const token = process.env.DISCORD_TOKEN;
        const guild = await ctx.prisma.guild.findUnique({
            where: {
                id: guildId
            },
            select: {
                hub: true,
                hubChannel: true
            }
        });
        if (!guild) {
            throw new server_1.TRPCError({
                message: 'Guild not found',
                code: 'NOT_FOUND'
            });
        }
        try {
            Promise.all([
                fetch(`https://discordapp.com/api/channels/${guild.hubChannel}`, {
                    headers: {
                        Authorization: `Bot ${token}`
                    },
                    method: 'DELETE'
                }),
                fetch(`https://discordapp.com/api/channels/${guild.hub}`, {
                    headers: {
                        Authorization: `Bot ${token}`
                    },
                    method: 'DELETE'
                })
            ]).then(async () => {
                await ctx.prisma.guild.update({
                    where: {
                        id: guildId
                    },
                    data: {
                        hub: null,
                        hubChannel: null
                    }
                });
            });
        }
        catch (e) {
            console.log(e);
            throw new server_1.TRPCError({
                message: 'Could not delete channel',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    }),
    getTempChannel: trpc_1.t.procedure
        .input(zod_1.z.object({
        guildId: zod_1.z.string(),
        ownerId: zod_1.z.string()
    }))
        .query(async ({ ctx, input }) => {
        const { guildId, ownerId } = input;
        const tempChannel = await ctx.prisma.tempChannel.findFirst({
            where: {
                guildId,
                ownerId
            }
        });
        return { tempChannel };
    }),
    createTempChannel: trpc_1.t.procedure
        .input(zod_1.z.object({
        guildId: zod_1.z.string(),
        ownerId: zod_1.z.string(),
        channelId: zod_1.z.string()
    }))
        .mutation(async ({ ctx, input }) => {
        const { guildId, ownerId, channelId } = input;
        const tempChannel = await ctx.prisma.tempChannel.create({
            data: {
                guildId,
                ownerId,
                id: channelId
            }
        });
        return { tempChannel };
    }),
    deleteTempChannel: trpc_1.t.procedure
        .input(zod_1.z.object({
        channelId: zod_1.z.string()
    }))
        .mutation(async ({ ctx, input }) => {
        const { channelId } = input;
        const tempChannel = await ctx.prisma.tempChannel.delete({
            where: {
                id: channelId
            }
        });
        return { tempChannel };
    })
});
//# sourceMappingURL=hub.js.map