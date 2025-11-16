import { t } from "../trpc";
import { z } from "zod";

export const robLogRouter = t.router({
  getLastRobbed: t.procedure
    .input(
      z.object({
        victimId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const lastRobbery = await ctx.prisma.robLog.findFirst({
        where: {
          victimId: input.victimId,
          success: true,
        },
        orderBy: {
          timestamp: "desc",
        },
      });
      return { lastRobbery };
    }),
  getLastVictimRobbed: t.procedure
    .input(
      z.object({
        robberId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const lastVictim = await ctx.prisma.robLog.findFirst({
        where: {
          robberId: input.robberId,
          success: true,
        },
        orderBy: {
          timestamp: "desc",
        },
      });
      return { lastVictim };
    }),
  create: t.procedure
    .input(
      z.object({
        robberId: z.string(),
        victimId: z.string(),
        success: z.boolean(),
        amount: z.number(),
        reason: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { robberId, victimId, success, amount, reason } = input;
      const log = await ctx.prisma.robLog.create({
        data: {
          robberId,
          victimId,
          success,
          amount,
          reason
        }
      });
      return { log };
    }),
  getLeaderboard: t.procedure.query(async ({ ctx }) => {
    const leaderboard = await ctx.prisma.user.findMany({
      orderBy: [
        {
          cash: "desc",
        },
        {
          name: "desc",
        },
      ],
    });

    return { leaderboard };
  }),
});
