import { t } from "../trpc";
import { z } from "zod";

export const inventoryRouter = t.router({
  getAll: t.procedure.query(async ({ ctx }) => {
    const all = await ctx.prisma.inventory.findMany();

    return { all };
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
          userId,
        },
      });

      return { inventory };
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

      const userItem = await ctx.prisma.inventory.findUnique({
        where: {
          userId_itemId: { userId, itemId }
        }
      });

      const item = await ctx.prisma.inventory.update({
        where: {
          userId_itemId: { userId, itemId },
        },
        data: { amount: userItem!.amount + 1 },
      });

      return { item };
    }),
  create: t.procedure
    .input(
      z.object({
        userId: z.string(),
        itemId: z.number(),
        amount: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, itemId, amount } = input;

      const inventory = await ctx.prisma.inventory.create({
        data: {
          userId,
          itemId,
          amount,
        },
      });

      return { inventory };
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
          userId,
          itemId,
        },
      });

      return { inventory };
    }),
});
