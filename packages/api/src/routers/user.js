"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
exports.userRouter = trpc_1.t.router({
    getUserById: trpc_1.t.procedure
        .input(zod_1.z.object({
        id: zod_1.z.string()
    }))
        .query(async ({ ctx, input }) => {
        const { id } = input;
        const user = await ctx.prisma.user.findUnique({
            where: {
                discordId: id
            }
        });
        return { user };
    }),
    create: trpc_1.t.procedure
        .input(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string()
    }))
        .mutation(async ({ ctx, input }) => {
        const { id, name } = input;
        const user = await ctx.prisma.user.upsert({
            where: {
                discordId: id
            },
            update: {},
            create: {
                discordId: id,
                name
            }
        });
        return { user };
    }),
    delete: trpc_1.t.procedure
        .input(zod_1.z.object({
        id: zod_1.z.string()
    }))
        .mutation(async ({ ctx, input }) => {
        const { id } = input;
        const user = await ctx.prisma.user.delete({
            where: {
                discordId: id
            }
        });
        return { user };
    }),
    updateTimeOffset: trpc_1.t.procedure
        .input(zod_1.z.object({
        id: zod_1.z.string(),
        timeOffset: zod_1.z.number()
    }))
        .mutation(async ({ ctx, input }) => {
        const { id, timeOffset } = input;
        const userTime = await ctx.prisma.user.update({
            where: {
                discordId: id
            },
            data: { timeOffset: timeOffset },
            select: { timeOffset: true }
        });
        return { userTime };
    })
});
//# sourceMappingURL=user.js.map