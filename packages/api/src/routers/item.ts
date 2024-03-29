import { t } from "../trpc";
import { z } from "zod";

export const itemRouter = t.router({
  getItemById: t.procedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { id } = input;

      const item = await ctx.prisma.item.findUnique({
        where: {
          id: id,
        },
      });

      return { item };
    }),
  getAll: t.procedure.query(async ({ ctx }) => {
    const allItems = await ctx.prisma.item.findMany({
      orderBy: [
        {
          buyPrice: "asc",
        },
        {
          id: "asc",
        },
      ],
    });

    return { allItems };
  }),
  create: t.procedure
    .input(
      z.object({
        name: z.string(),
        emoji: z.string(),
        description: z.string(),
        buyPrice: z.number(),
        stock: z.number(),
        stackable: z.boolean(),
        consumable: z.boolean(),
        roleGiven: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const {
        name,
        emoji,
        description,
        buyPrice,
        stock,
        stackable,
        consumable,
        roleGiven,
      } = input;
      const item = await ctx.prisma.item.create({
        data: {
          name,
          emoji,
          description,
          buyPrice,
          stock,
          stackable,
          consumable,
          roleGiven,
        },
      });

      return { item };
    }),
  buyItem: t.procedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      const item = await ctx.prisma.item.findUnique({
        where: {
          id: id,
        },
      });

      const stock = await ctx.prisma.item.update({
        where: {
          id: id,
        },
        data: { stock: item!.stock - 1 },
      });

      return { stock };
    }),
});
