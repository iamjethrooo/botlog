import { t } from "../trpc";
import { z } from "zod";

export const settingRouter = t.router({
  getAll: t.procedure.query(async ({ ctx }) => {
    const all = await ctx.prisma.setting.findMany();

    return { all };
  }),
  getByGuildId: t.procedure
    .input(
      z.object({
        guildId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { guildId } = input;

      const settings = await ctx.prisma.setting.findMany({
        where: {
          guildId,
        },
      });

      return settings;
    }),
  create: t.procedure
    .input(
      z.object({
        guildId: z.string(),
        settingKey: z.string(),
        settingValue: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { guildId, settingKey, settingValue } = input;

      const setting = await ctx.prisma.setting.create({
        data: {
          guildId,
          settingKey,
          settingValue
        },
      });

      return { setting };
    }),
});
