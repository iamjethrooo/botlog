import { t } from "../trpc";
import { z } from "zod";

export const holdupLogRouter = t.router({
    getLastHoldup: t.procedure
        .input(
            z.object({
                suspectId: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const lastHoldup = await ctx.prisma.holdupLog.findFirst({
                where: {
                    participants: {
                        array_contains: [input.suspectId]
                    }
                },
                orderBy: {
                    timestamp: "desc",
                },
            });
            return { lastHoldup };
        }),
    getLastTimeHeldup: t.procedure
        .input(
            z.object({
                victimId: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const lastTimeHeldup = await ctx.prisma.holdupLog.findFirst({
                where: {
                    success: true,
                    victimId: input.victimId
                },
                orderBy: {
                    timestamp: "desc",
                },
            });
            return { lastTimeHeldup };
        }),
    create: t.procedure
        .input(
            z.object({
                victimId: z.string(),
                leaderId: z.string(),
                participants: z.array(z.string()),
                success: z.boolean(),
                totalLoot: z.number()
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { victimId, leaderId, participants, success, totalLoot } = input;
            const log = await ctx.prisma.holdupLog.create({
                data: {
                    victimId,
                    leaderId,
                    participants,
                    success,
                    totalLoot
                }
            });
            return { log };
        }),
});
