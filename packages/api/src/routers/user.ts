import { t } from "../trpc";
import { z } from "zod";
import { economyError, economyInteger, economySetting, economyTransaction } from "../economy";

export const userRouter = t.router({
  transfer: t.procedure
    .input(z.object({
      sourceId: z.string().min(1),
      recipientId: z.string().min(1),
      recipientName: z.string(),
      amount: z.number().int().positive().max(2147483647),
    }))
    .mutation(async ({ ctx, input }) => {
      const { sourceId, recipientId, recipientName, amount } = input;
      if (sourceId === recipientId) economyError("You cannot transfer coins to yourself.");
      return economyTransaction(ctx.prisma, async (tx) => {
        const debit = await tx.user.updateMany({
          where: { discordId: sourceId, cash: { gte: amount } },
          data: { cash: { decrement: amount } },
        });
        if (debit.count !== 1) economyError("You cannot transfer more than your current balance.");
        const existing = await tx.user.findUnique({ where: { discordId: recipientId } });
        const startingCash = existing ? 0 : await economySetting(tx, "startingCash");
        if (!Number.isInteger(startingCash)) economyError("Invalid starting balance.");
        const recipient = await tx.user.upsert({
          where: { discordId: recipientId },
          update: { cash: { increment: amount } },
          create: { discordId: recipientId, name: recipientName, cash: startingCash + amount },
        });
        return { recipient };
      });
    }),
  getUserById: t.procedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { id } = input;

      const user = await ctx.prisma.user.findUnique({
        where: {
          discordId: id,
        },
      });

      return { user };
    }),
  create: t.procedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name } = input;
      const user = await ctx.prisma.user.upsert({
        where: {
          discordId: id,
        },
        update: {},
        create: {
          discordId: id,
          name,
        },
      });
      return { user };
    }),
  delete: t.procedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      const user = await ctx.prisma.user.delete({
        where: {
          discordId: id,
        },
      });

      return { user };
    }),
  updateTimeOffset: t.procedure
    .input(
      z.object({
        id: z.string(),
        timeOffset: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, timeOffset } = input;
      const userTime = await ctx.prisma.user.update({
        where: {
          discordId: id,
        },
        data: { timeOffset: timeOffset },
        select: { timeOffset: true },
      });

      return { userTime };
    }),
  updateLastMessageDate: t.procedure
    .input(
      z.object({
        id: z.string(),
        date: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, date } = input;

      const lastMessageDate = await ctx.prisma.user.update({
        where: {
          discordId: id,
        },
        data: { lastMessageDate: date },
      });

      return { lastMessageDate };
    }),
  updateLastRobDate: t.procedure
    .input(
      z.object({
        id: z.string(),
        date: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, date } = input;

      const lastRobDate = await ctx.prisma.user.update({
        where: {
          discordId: id,
        },
        data: { lastRobDate: date },
      });

      return { lastRobDate };
    }),
  updateLastBodyguardDate: t.procedure
    .input(
      z.object({
        id: z.string(),
        date: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, date } = input;

      const lastBodyguardDate = await ctx.prisma.user.update({
        where: {
          discordId: id,
        },
        data: { lastBodyguardDate: date },
      });

      return { lastBodyguardDate };
    }),
  updateLastHeistDate: t.procedure
    .input(
      z.object({
        id: z.string(),
        date: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, date } = input;

      const lastHeistDate = await ctx.prisma.user.update({
        where: {
          discordId: id,
        },
        data: { lastHeistDate: date },
      });

      return { lastHeistDate };
    }),
  updateLastCoinFlipDate: t.procedure
    .input(
      z.object({
        id: z.string(),
        date: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, date } = input;

      const lastCoinFlipDate = await ctx.prisma.user.update({
        where: {
          discordId: id,
        },
        data: { lastCoinFlipDate: date },
      });

      return { lastCoinFlipDate };
    }),
  setJailTime: t.procedure
    .input(
      z.object({
        id: z.string(),
        jailTime: z.string(),
        lastHeistDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, jailTime, lastHeistDate } = input;

      const jt = await ctx.prisma.user.update({
        where: {
          discordId: id,
        },
        data: { jailTime, lastHeistDate },
      });

      return { jt };
    }),
  setFailedRobAttempts: t.procedure
    .input(
      z.object({
        id: z.string(),
        failedRobAttempts: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, failedRobAttempts } = input;

      const newValue = await ctx.prisma.user.update({
        where: {
          discordId: id,
        },
        data: { failedRobAttempts: failedRobAttempts },
      });

      return newValue;
    }),
  addCash: t.procedure
    .input(
      z.object({
        id: z.string(),
        cash: economyInteger,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, cash } = input;

      const userCash = await ctx.prisma.user.update({
        where: {
          discordId: id,
        },
        data: { cash: { increment: cash } },
      });

      return { userCash };
    }),
  subtractCash: t.procedure
    .input(
      z.object({
        id: z.string(),
        cash: economyInteger,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, cash } = input;

      const userCash = await ctx.prisma.user.update({
        where: {
          discordId: id,
        },
        data: { cash: { decrement: cash } },
      });

      return { userCash };
    }),
  getLeaderboard: t.procedure.query(async ({ ctx }) => {
    // Preserve the catalog's first case-insensitive Fake ID match, including
    // zero-quantity ownership. Do not return the catalog or other user fields.
    const items = await ctx.prisma.item.findMany({ select: { id: true, name: true } });
    const fakeId = items.find((item) => item.name.toLowerCase() === "fake id");
    const leaderboard = await ctx.prisma.user.findMany({
      where: {
        NOT: { cash: 15000 }
      },
      orderBy: [
        {
          cash: "desc",
        },
        {
          name: "desc",
        },
      ],
      select: {
        discordId: true,
        cash: true,
        items: fakeId ? {
          where: { itemId: fakeId.id },
          select: { itemId: true },
        } : false,
      },
    });

    return { leaderboard: leaderboard.map((user) => ({
      discordId: user.discordId,
      cash: user.cash,
      hasFakeId: !!user.items?.length,
    })) };
  }),
});
