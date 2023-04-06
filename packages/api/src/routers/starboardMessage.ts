import { t } from "../trpc";
import { z } from "zod";

export const starboardMessageRouter = t.router({
  getAll: t.procedure.query(async ({ ctx }) => {
    const all = await ctx.prisma.starboardMessage.findMany();

    return { all };
  }),
  getByMessageId: t.procedure
    .input(
      z.object({
        messageId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { messageId } = input;

      const message = await ctx.prisma.starboardMessage.findMany({
        where: {
          messageId,
        },
      });

      return { message };
    }),
  create: t.procedure
    .input(
      z.object({
        messageId: z.string(),
        channelId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { messageId, channelId } = input;

      const starboardMessage = await ctx.prisma.starboardMessage.create({
        data: {
          messageId,
          channelId,
        },
      });

      return { starboardMessage };
    }),
  delete: t.procedure
    .input(
      z.object({
        messageId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { messageId } = input;

      const starboardMessage = await ctx.prisma.starboardMessage.delete({
        where: {
          messageId,
        },
      });

      return { starboardMessage };
    }),
});
