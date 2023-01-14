"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reminderRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
exports.reminderRouter = trpc_1.t.router({
    getAll: trpc_1.t.procedure.query(async ({ ctx }) => {
        const reminders = await ctx.prisma.reminder.findMany();
        return { reminders };
    }),
    getReminder: trpc_1.t.procedure
        .input(zod_1.z.object({
        userId: zod_1.z.string(),
        event: zod_1.z.string()
    }))
        .mutation(async ({ ctx, input }) => {
        const { userId, event } = input;
        const reminder = await ctx.prisma.reminder.findFirst({
            where: {
                userId,
                event
            },
            include: { user: true }
        });
        return { reminder };
    }),
    getByUserId: trpc_1.t.procedure
        .input(zod_1.z.object({
        userId: zod_1.z.string()
    }))
        .mutation(async ({ ctx, input }) => {
        const { userId } = input;
        const reminders = await ctx.prisma.reminder.findMany({
            where: {
                userId
            },
            select: {
                event: true,
                dateTime: true,
                description: true
            },
            orderBy: {
                id: 'asc'
            }
        });
        return { reminders };
    }),
    create: trpc_1.t.procedure
        .input(zod_1.z.object({
        userId: zod_1.z.string(),
        event: zod_1.z.string(),
        description: zod_1.z.nullable(zod_1.z.string()),
        dateTime: zod_1.z.string(),
        repeat: zod_1.z.nullable(zod_1.z.string()),
        timeOffset: zod_1.z.number()
    }))
        .mutation(async ({ ctx, input }) => {
        const { userId, event, description, dateTime, repeat, timeOffset } = input;
        const reminder = await ctx.prisma.reminder.create({
            data: {
                event,
                description,
                dateTime,
                repeat,
                timeOffset,
                user: { connect: { discordId: userId } }
            }
        });
        return { reminder };
    }),
    delete: trpc_1.t.procedure
        .input(zod_1.z.object({
        userId: zod_1.z.string(),
        event: zod_1.z.string()
    }))
        .mutation(async ({ ctx, input }) => {
        const { userId, event } = input;
        const reminder = await ctx.prisma.reminder.deleteMany({
            where: {
                userId,
                event
            }
        });
        return { reminder };
    })
});
//# sourceMappingURL=reminder.js.map