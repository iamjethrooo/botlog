import { t } from "../trpc";
import { z } from "zod";

export const userRouter = t.router({
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
        date: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, date } = input;

      const lastMessageDate = await ctx.prisma.user.update({
        where: {
          discordId: id,
        },
        data: { lastMessageDate: date }
      });

      return { lastMessageDate };
    }),
  addCash: t.procedure
    .input(
      z.object({
        id: z.string(),
        cash: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, cash } = input;

      const user = await ctx.prisma.user.findUnique({
        where: {
          discordId: id,
        },
      });

      const userCash = await ctx.prisma.user.update({
        where: {
          discordId: id,
        },
        data: { cash: user!.cash+ cash }
      });

      return { userCash };
    }),
});
