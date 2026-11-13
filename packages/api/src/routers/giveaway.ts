import { TRPCError } from "@trpc/server";
import { t } from "../trpc";
import { z } from "zod";
import { economyError, economyTransaction } from "../economy";

const fee = z.string().refine((value) => value.trim() !== "" && Number.isSafeInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 2147483647, "Invalid entry fee");
const endTime = z.string().refine((value) => value.trim() !== "" && Number.isSafeInteger(Number(value)) && Number(value) > Date.now() && Number(value) <= 8640000000000000, "End time must be in the future");

export const giveawayRouter = t.router({
  // #region Create
  create: t.procedure
    .input(
      z.object({
        messageId: z.string(),
        giveawayId: z.string(),
        hostId: z.string(),
        entryFee: fee,
        prize: z.string().min(1).max(256),
        numOfWinners: z.number().int().min(1).max(100),
        numOfEntries: z.number().int().min(1).max(2147483647),
        endsAt: endTime,
        dateStarted: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const {
        messageId,
        giveawayId,
        hostId,
        entryFee,
        prize,
        numOfWinners,
        numOfEntries,
        endsAt,
        dateStarted,
      } = input;

      const giveaway = await ctx.prisma.giveaway.create({
        data: {
          messageId,
          giveawayId,
          hostId,
          entryFee,
          prize,
          numOfWinners,
          numOfEntries,
          endsAt,
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
      return economyTransaction(ctx.prisma, async (tx) => {
        const giveaway = await tx.giveaway.findUnique({ where: { giveawayId } });
        if (!giveaway) return { status: "missing" as const };
        if (giveaway.ended) return { status: "ended" as const };
        // Serialize entry against the completion snapshot using the existing
        // giveaway row. No state transition or Discord work occurs here.
        await tx.giveaway.update({ where: { giveawayId }, data: { ended: false } });
        if (Date.now() >= Number(giveaway.endsAt))
          return { status: "ended" as const };
        if (!fee.safeParse(giveaway.entryFee).success ||
            !Number.isSafeInteger(Number(giveaway.endsAt)) || Number(giveaway.endsAt) <= 0 ||
            !Number.isInteger(giveaway.numOfEntries) || giveaway.numOfEntries < 1)
          economyError("Invalid giveaway configuration.");
        const count = await tx.giveawayEntry.count({ where: { giveawayId, userId } });
        if (count >= giveaway.numOfEntries) return { status: "cap" as const };
        const paid = await tx.user.updateMany({
          where: { discordId: userId, cash: { gte: Number(giveaway.entryFee) } },
          data: { cash: { decrement: Number(giveaway.entryFee) } },
        });
        if (!paid.count) return { status: "funds" as const };
        await tx.giveawayEntry.create({ data: { giveawayId, userId } });
        return { status: "joined" as const };
      });
    }),
  // #endregion

  // #region Read
  getCompletionEntries: t.procedure
    .input(z.object({ giveawayId: z.string() }))
    .mutation(async ({ ctx, input }) => economyTransaction(ctx.prisma, async (tx) => {
      const giveaway = await tx.giveaway.findUnique({ where: input });
      if (!giveaway || giveaway.ended || !Number.isSafeInteger(Number(giveaway.endsAt)) ||
          Number(giveaway.endsAt) <= 0 || Date.now() < Number(giveaway.endsAt))
        economyError("Giveaway is not ready for completion.");
      await tx.giveaway.update({ where: input, data: { ended: false } });
      return tx.giveawayEntry.findMany({ where: input });
    })),
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

      const giveaway = await ctx.prisma.giveaway.updateMany({
        where: {
          giveawayId,
          ended: false,
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
      try {
        return await ctx.prisma.giveaway.deleteMany({ where: input });
      } catch (error) {
        if ((error as { code?: string })?.code === "P2003") {
          throw new TRPCError({ code: "CONFLICT", message: "A giveaway with entries cannot be deleted." });
        }
        throw error;
      }
    }),
  // #endregion
});
