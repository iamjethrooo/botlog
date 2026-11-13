import { t } from "../trpc";
import { z } from "zod";
import { economyInteger } from "../economy";

export const inventoryRouter = t.router({
  getDisplayByUserId: t.procedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const inventory = await ctx.prisma.inventory.findMany({
        where: { userDiscordId: input.userId },
        select: {
          itemId: true,
          amount: true,
          item: { select: { name: true, emoji: true } },
        },
      });
      return { inventory };
    }),
  getAll: t.procedure.query(async ({ ctx }) => {
    const all = await ctx.prisma.inventory.findMany();

    return { all: all.map(withLegacyUserId) };
  }),
  getByUserId: t.procedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = input;

      const inventory = await ctx.prisma.inventory.findMany({
        where: {
          userDiscordId: userId,
        },
      });

      return { inventory: inventory.map(withLegacyUserId) };
    }),
  incrementUserItemAmount: t.procedure
    .input(
      z.object({
        userId: z.string(),
        itemId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, itemId } = input;

      const item = await ctx.prisma.inventory.update({
        where: {
          userDiscordId_itemId: { userDiscordId: userId, itemId },
        },
        data: { amount: { increment: 1 } },
      });

      return { item: withLegacyUserId(item) };
    }),
  create: t.procedure
    .input(
      z.object({
        userId: z.string(),
        itemId: z.number(),
        amount: economyInteger.nonnegative(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, itemId, amount } = input;

      const inventory = await ctx.prisma.inventory.create({
        data: {
          userDiscordId: userId,
          itemId,
          amount,
        },
      });

      return { inventory: withLegacyUserId(inventory) };
    }),
  delete: t.procedure
    .input(
      z.object({
        userId: z.string(),
        itemId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, itemId } = input;

      const inventory = await ctx.prisma.inventory.deleteMany({
        where: {
          userDiscordId: userId,
          itemId,
        },
      });

      return { inventory };
    }),
});

function withLegacyUserId<T extends { userDiscordId: string }>(row: T) {
  return { ...row, userId: row.userDiscordId };
}
