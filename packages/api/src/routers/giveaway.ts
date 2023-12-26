import { t } from "../trpc";
import { z } from "zod";

export const giveawayRouter = t.router({
  // #region Create
  create: t.procedure
    .input(
      z.object({
        messageId: z.string(),
        giveawayId: z.string(),
        entryFee: z.string(),
        prize: z.string(),
        numOfWinners: z.number(),
        numOfEntries: z.number(),
        duration: z.string(),
        dateStarted: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const {
        messageId,
        giveawayId,
        entryFee,
        prize,
        numOfWinners,
        numOfEntries,
        duration,
        dateStarted,
      } = input;

      const giveaway = await ctx.prisma.giveaway.create({
        data: {
          messageId,
          giveawayId,
          entryFee,
          prize,
          numOfWinners,
          numOfEntries,
          duration,
          dateStarted,
        },
      });

      return giveaway;
    }),

  addEntry: t.procedure
    .input(
      z.object({
        giveawayId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { giveawayId, userId } = input;

      const giveawayEntry = await ctx.prisma.giveawayEntry.create({
        data: {
          giveawayId,
          userId,
        },
      });

      return giveawayEntry;
    }),
  // #endregion

  // #region Read
  getAll: t.procedure.query(async ({ ctx }) => {
    const all = await ctx.prisma.giveaway.findMany();

    return all;
  }),
  getActive: t.procedure.query(async ({ ctx }) => {
    const active = await ctx.prisma.giveaway.findMany({
      where: {
        ended: false,
      },
    });

    return active;
  }),
  getById: t.procedure
    .input(
      z.object({
        giveawayId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { giveawayId } = input;

      const giveaway = await ctx.prisma.giveaway.findUnique({
        where: {
          giveawayId: giveawayId,
        },
      });

      return giveaway;
    }),
  getEntries: t.procedure
    .input(
      z.object({
        giveawayId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { giveawayId } = input;

      const entries = await ctx.prisma.giveawayEntry.findMany({
        where: {
          giveawayId: giveawayId,
        },
      });

      return entries;
    }),
  getParticipants: t.procedure
    .input(
      z.object({
        giveawayId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { giveawayId } = input;

      const participants = await ctx.prisma.giveawayEntry.findMany({
        where: {
          giveawayId: giveawayId,
        },
        distinct: "userId",
      });

      return participants;
    }),
  // #endregion

  // #region Update
  endGiveaway: t.procedure
    .input(z.object({ giveawayId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { giveawayId } = input;

      const giveaway = await ctx.prisma.giveaway.update({
        where: {
          giveawayId,
        },
        data: { ended: true },
      });

      return giveaway;
    }),
  // #endregion

  // #region Delete
  delete: t.procedure
    .input(
      z.object({
        giveawayId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { giveawayId } = input;

      const giveaway = await ctx.prisma.giveaway.deleteMany({
        where: {
          giveawayId,
        },
      });

      return giveaway;
    }),
  // #endregion
});
