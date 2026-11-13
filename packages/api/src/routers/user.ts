import { t } from "../trpc";
import { z } from "zod";
import { cooldownDate, discordEventId, economyError, economyInteger, economyOperation, economySetting, economySettings, economyTransaction, legacyCooldownDate } from "../economy";

export const userRouter = t.router({
  claimMessageReward: t.procedure
    .input(z.object({ messageId: discordEventId, userId: z.string().min(1), name: z.string() }))
    .mutation(async ({ ctx, input }) => economyOperation(
      ctx.prisma, input.messageId, "message_reward", input.userId, async tx => {
        const { startingCash, minCashPerChat, maxCashPerChat, interval } = await economySettings(
          tx, ["startingCash", "minCashPerChat", "maxCashPerChat", "interval"],
          ["startingCash", "minCashPerChat", "maxCashPerChat"],
        );
        const min = Math.ceil(minCashPerChat);
        const max = Math.floor(maxCashPerChat);
        if (!economyInteger.safeParse(startingCash).success ||
            !economyInteger.safeParse(min).success || !economyInteger.safeParse(max).success || min > max) {
          economyError("Invalid message reward settings.");
        }
        const where = { discordId: input.userId };
        const user = await tx.user.findUnique({ where });
        if (!user) {
          await tx.user.create({ data: { ...where, name: input.name, cash: startingCash } });
          return { status: "initialized", amount: startingCash } as const;
        }
        const now = Date.now();
        const lastReward = Number(user.lastMessageRewardAt ?? user.lastMessageDate);
        if (!Number.isFinite(lastReward) || now - lastReward < interval * 1000) {
          return { status: "cooldown", amount: 0 } as const;
        }
        const amount = Math.floor(Math.random() * (max - min + 1)) + min;
        await tx.user.update({
          where,
          data: { cash: { increment: amount }, lastMessageRewardAt: new Date(now), lastMessageDate: String(now) },
        });
        return { status: "awarded", amount } as const;
      },
    )),
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
        date: legacyCooldownDate,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, date } = input;

      const lastMessageDate = await ctx.prisma.user.update({
        where: {
          discordId: id,
        },
        data: { lastMessageDate: date, lastMessageRewardAt: cooldownDate(date) },
      });

      return { lastMessageDate };
    }),
  updateLastRobDate: t.procedure
    .input(
      z.object({
        id: z.string(),
        date: legacyCooldownDate,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, date } = input;

      const lastRobDate = await ctx.prisma.user.update({
        where: {
          discordId: id,
        },
        data: { lastRobDate: date, lastRobAt: cooldownDate(date) },
      });

      return { lastRobDate };
    }),
  updateLastBodyguardDate: t.procedure
    .input(
      z.object({
        id: z.string(),
        date: legacyCooldownDate,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, date } = input;

      const lastBodyguardDate = await ctx.prisma.user.update({
        where: {
          discordId: id,
        },
        data: { lastBodyguardDate: date, lastBodyguardAt: cooldownDate(date) },
      });

      return { lastBodyguardDate };
    }),
  updateLastHeistDate: t.procedure
    .input(
      z.object({
        id: z.string(),
        date: legacyCooldownDate,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, date } = input;

      const lastHeistDate = await ctx.prisma.user.update({
        where: {
          discordId: id,
        },
        data: { lastHeistDate: date, lastHeistAt: cooldownDate(date) },
      });

      return { lastHeistDate };
    }),
  updateLastCoinFlipDate: t.procedure
    .input(
      z.object({
        id: z.string(),
        date: legacyCooldownDate,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, date } = input;

      const lastCoinFlipDate = await ctx.prisma.user.update({
        where: {
          discordId: id,
        },
        data: { lastCoinFlipDate: date, lastCoinFlipAt: cooldownDate(date) },
      });

      return { lastCoinFlipDate };
    }),
  setJailTime: t.procedure
    .input(
      z.object({
        id: z.string(),
        jailTime: z.string().refine(value => /^-?\d+$/.test(value) && economyInteger.safeParse(Number(value)).success),
        lastHeistDate: legacyCooldownDate.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, jailTime, lastHeistDate } = input;

      const jt = await ctx.prisma.user.update({
        where: {
          discordId: id,
        },
        data: {
          jailTime,
          jailDurationSeconds: Number(jailTime),
          lastHeistDate,
          lastHeistAt: lastHeistDate === undefined ? undefined : cooldownDate(lastHeistDate),
        },
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
  getGuildLeaderboard: t.procedure
    .input(z.object({ memberIds: z.array(z.string().min(1).max(20)) }))
    .mutation(async ({ ctx, input }) => {
      if (input.memberIds.length === 0) return { leaderboard: [] };
      // Send membership as one parameter so large guilds don't hit PostgreSQL's
      // parameter limit. Rank remains relative to the entire guild.
      const leaderboard = await ctx.prisma.$queryRaw<{
        discordId: string;
        cash: number;
        hasFakeId: boolean;
      }[]>`
        SELECT u."discordId", u.cash, EXISTS (
          SELECT 1 FROM "Item" item JOIN "Inventory" inventory ON inventory."itemId" = item.id
          WHERE item."systemKey" = 'FAKE_ID' AND inventory."userId" = u."discordId"
        ) AS "hasFakeId"
        FROM "User" u
        WHERE u.cash <> 15000
          AND u."discordId" IN (SELECT jsonb_array_elements_text(${JSON.stringify(input.memberIds)}::jsonb))
        ORDER BY u.cash DESC, u.name DESC, u."discordId" ASC
      `;
      return { leaderboard };
    }),
  // Keep the original endpoint for callers predating guild membership input.
  getLeaderboard: t.procedure.query(async ({ ctx }) => {
    const fakeId = await ctx.prisma.item.findUnique({ where: { systemKey: "FAKE_ID" }, select: { id: true } });
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
        { discordId: "asc" },
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
