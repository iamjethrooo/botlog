import { t } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
export const reminderRouter = t.router({
  getAll: t.procedure.query(async ({ ctx }) => {
    const reminders = await ctx.prisma.reminder.findMany();

    return { reminders: reminders.map(reminder => ({ ...reminder, userId: reminder.userDiscordId })) };
  }),
  getReminder: t.procedure
    .input(
      z.object({
        userId: z.string(),
        event: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, event } = input;

      const reminder = await ctx.prisma.reminder.findFirst({
        where: {
          userDiscordId: userId,
          event
        },
        include: { user: true }
      });

      return { reminder: reminder && { ...reminder, userId: reminder.userDiscordId } };
    }),
  getByUserId: t.procedure
    .input(
      z.object({
        userId: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = input;

      const reminders = await ctx.prisma.reminder.findMany({
        where: {
          userDiscordId: userId
        },
        select: {
          event: true,
          dateTime: true,
          scheduledAt: true,
          description: true
        },
        orderBy: {
          id: 'asc'
        }
      });

      return { reminders };
    }),
  create: t.procedure
    .input(
      z.object({
        userId: z.string(),
        event: z.string(),
        description: z.nullable(z.string()),
        dateTime: z.string().optional(),
        scheduledAt: z.date().optional(),
        repeat: z.nullable(z.string()),
        timeOffset: z.number()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, event, description, dateTime, repeat, timeOffset } =
        input;
      const scheduledAt = input.scheduledAt ?? parseReminderDate(dateTime ?? '');
      if (!scheduledAt || scheduledAt.getUTCFullYear() < 1 || scheduledAt.getUTCFullYear() > 9999) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Provide a reminder timestamp with an explicit time zone.' });
      }

      const reminder = await ctx.prisma.reminder.create({
        data: {
          event,
          description,
          dateTime: dateTime ?? scheduledAt.toISOString(),
          scheduledAt,
          repeat,
          timeOffset,
          user: { connect: { discordId: userId } }
        }
      });

      return { reminder: { ...reminder, userId: reminder.userDiscordId } };
    }),
  delete: t.procedure
    .input(
      z.object({
        userId: z.string(),
        event: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, event } = input;

      const reminder = await ctx.prisma.reminder.deleteMany({
        where: {
          userDiscordId: userId,
          event
        }
      });

      return { reminder };
    })
});

function parseReminderDate(value: string) {
  const text = value.trim();
  if (/^\d{11,15}$/.test(text)) return new Date(Number(text));
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.test(text)) {
    const day = new Date(text.slice(0, 10) + 'T00:00:00Z');
    if (Number.isFinite(day.getTime()) && day.toISOString().slice(0, 10) === text.slice(0, 10)) {
      const date = new Date(text);
      if (Number.isFinite(date.getTime())) return date;
    }
  }
  return null;
}
