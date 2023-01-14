"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.welcomeRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
exports.welcomeRouter = trpc_1.t.router({
    getMessage: trpc_1.t.procedure
        .input(zod_1.z.object({
        guildId: zod_1.z.string()
    }))
        .query(async ({ ctx, input }) => {
        const { guildId } = input;
        const guild = await ctx.prisma.guild.findUnique({
            where: {
                id: guildId
            }
        });
        return {
            message: guild === null || guild === void 0 ? void 0 : guild.welcomeMessage
        };
    }),
    setMessage: trpc_1.t.procedure
        .input(zod_1.z.object({
        message: zod_1.z.string().min(4).max(100),
        guildId: zod_1.z.string()
    }))
        .mutation(async ({ ctx, input }) => {
        const { message, guildId } = input;
        const guild = await ctx.prisma.guild.update({
            where: {
                id: guildId
            },
            data: {
                welcomeMessage: message
            }
        });
        return { guild };
    }),
    setChannel: trpc_1.t.procedure
        .input(zod_1.z.object({
        channelId: zod_1.z.string(),
        guildId: zod_1.z.string()
    }))
        .mutation(async ({ ctx, input }) => {
        const { channelId, guildId } = input;
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
    getChannel: trpc_1.t.procedure
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
                welcomeMessageChannel: true
            }
        });
        return { guild };
    }),
    getStatus: trpc_1.t.procedure
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
                welcomeMessageEnabled: true
            }
        });
        return { guild };
    }),
    toggle: trpc_1.t.procedure
        .input(zod_1.z.object({
        guildId: zod_1.z.string(),
        status: zod_1.z.boolean()
    }))
        .mutation(async ({ ctx, input }) => {
        const { guildId, status } = input;
        const guild = await ctx.prisma.guild.update({
            where: {
                id: guildId
            },
            data: {
                welcomeMessageEnabled: status
            }
        });
        return { guild };
    })
});
//# sourceMappingURL=welcome.js.map