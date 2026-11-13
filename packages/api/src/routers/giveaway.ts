import { TRPCError } from "@trpc/server";
import { t } from "../trpc";
import { z } from "zod";
import { economyError, economyTransaction } from "../economy";

const fee = z.union([z.string().trim().min(1).transform(Number), z.number()])
  .pipe(z.number().int().nonnegative().max(2147483647));
const endTime = z.union([z.string().trim().min(1).transform(Number), z.date().transform(Number)])
  .pipe(z.number().int().max(253402300799000))
  .refine(value => value > Date.now(), "End time must be in the future")
  .transform(value => new Date(value));
const entryLimit = z.number().int().min(1).max(2147483647);

function giveawayResponse<T extends { maxEntriesPerUser: number }>(row: T) {
  return { ...row, numOfEntries: row.maxEntriesPerUser };
}

function entryResponse<T extends { userDiscordId: string }>(row: T) {
  return { ...row, userId: row.userDiscordId };
}

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
        numOfEntries: entryLimit.optional(),
        maxEntriesPerUser: entryLimit.optional(),
        endsAt: endTime,
        dateStarted: z.string().optional(),
        guildId: z.string().min(1).optional(),
        channelId: z.string().min(1).optional(),
      }).refine(input => (input.guildId === undefined) === (input.channelId === undefined),
        "Giveaway guild and channel must be supplied together")
        .refine(input => input.maxEntriesPerUser !== undefined || input.numOfEntries !== undefined,
          "An entry limit is required")
    )
    .mutation(async ({ ctx, input }) => {
      const {
        messageId,
        giveawayId,
        hostId,
        entryFee,
        prize,
        numOfWinners,
        maxEntriesPerUser,
        numOfEntries,
        endsAt,
        guildId,
        channelId,
      } = input;
      const legacyStart = input.dateStarted === undefined ? Date.now() : Number(input.dateStarted) * 1000;
      const startedAt = Number.isSafeInteger(legacyStart) && legacyStart > 0 && legacyStart <= 253402300799000
        ? new Date(legacyStart) : new Date();

      const giveaway = await ctx.prisma.giveaway.create({
        data: {
          messageId,
          giveawayId,
          hostId,
          entryFeeCoins: entryFee,
          entryFee: String(entryFee),
          prize,
          numOfWinners,
          maxEntriesPerUser: maxEntriesPerUser ?? numOfEntries,
          endsAtTimestamp: endsAt,
          endsAt: String(endsAt.getTime()),
          startedAt,
          dateStarted: String(Math.round(startedAt.getTime() / 1000)),
          guildId,
          channelId,
        },
      });

      return giveawayResponse(giveaway);
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
        const endsAt = Number(giveaway.endsAtTimestamp ?? giveaway.endsAt);
        if (Date.now() >= endsAt)
          return { status: "ended" as const };
        const price = fee.safeParse(giveaway.entryFeeCoins ?? giveaway.entryFee);
        if (!price.success || !Number.isSafeInteger(endsAt) || endsAt <= 0 ||
            !Number.isInteger(giveaway.maxEntriesPerUser) || giveaway.maxEntriesPerUser < 1)
          economyError("Invalid giveaway configuration.");
        const entry = { giveawayId, userDiscordId: userId };
        const count = await tx.giveawayEntry.count({ where: entry });
        if (count >= giveaway.maxEntriesPerUser) return { status: "cap" as const };
        const paid = await tx.user.updateMany({
          where: { discordId: userId, cash: { gte: price.data } },
          data: { cash: { decrement: price.data } },
        });
        if (!paid.count) return { status: "funds" as const };
        await tx.giveawayEntry.create({ data: entry });
        return { status: "joined" as const };
      });
    }),
  // #endregion

  // #region Read
  getCompletionEntries: t.procedure
    .input(z.object({ giveawayId: z.string() }))
    .mutation(async ({ ctx, input }) => economyTransaction(ctx.prisma, async (tx) => {
      const giveaway = await tx.giveaway.findUnique({ where: input });
      const endsAt = Number(giveaway?.endsAtTimestamp ?? giveaway?.endsAt);
      if (!giveaway || giveaway.ended || !Number.isSafeInteger(endsAt) || endsAt <= 0 || Date.now() < endsAt)
        economyError("Giveaway is not ready for completion.");
      await tx.giveaway.update({ where: input, data: { ended: false } });
      return (await tx.giveawayEntry.findMany({ where: input })).map(entryResponse);
    })),
  getAll: t.procedure.query(async ({ ctx }) => {
    const all = await ctx.prisma.giveaway.findMany();

    return all.map(giveawayResponse);
  }),
  getActive: t.procedure.query(async ({ ctx }) => {
    const active = await ctx.prisma.giveaway.findMany({
      where: {
        ended: false,
      },
    });

    return active.map(giveawayResponse);
  }),
  recordLegacyLocation: t.procedure
    .input(z.object({
      giveawayId: z.string().min(1),
      messageId: z.string().min(1),
      guildId: z.string().min(1),
      channelId: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const { giveawayId, messageId, guildId, channelId } = input;
      const changed = await ctx.prisma.giveaway.updateMany({
        where: { giveawayId, messageId, guildId: null, channelId: null },
        data: { guildId, channelId },
      });
      if (changed.count) return;
      const current = await ctx.prisma.giveaway.findUnique({ where: { giveawayId } });
      if (current?.messageId !== messageId || current.guildId !== guildId || current.channelId !== channelId) {
        throw new TRPCError({ code: "CONFLICT", message: "Giveaway location has changed." });
      }
    }),
  getById: t.procedure
    .input(
      z.object({
        giveawayId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { giveawayId } = input;
      const giveaway = await ctx.prisma.giveaway.findUnique({ where: { giveawayId } });

      return giveaway && giveawayResponse(giveaway);
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

      return entries.map(entryResponse);
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
        distinct: "userDiscordId",
      });

      return participants.map(entryResponse);
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
