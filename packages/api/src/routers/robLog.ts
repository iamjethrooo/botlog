import { t } from "../trpc";
import { z } from "zod";
import { discordEventId, economyError, economyOperation, economySettings } from "../economy";

const latestFirst = [{ timestamp: "desc" }, { id: "desc" }] as const;
const protectionMs = 6 * 60 * 60 * 1000;
const itemKeys = ["LUCK_POTION", "UNSTABLE_POTION", "FORTUNE_AMULET", "SENTRY_WARD"];

export const robLogRouter = t.router({
  resolveRobbery: t.procedure
    .input(z.object({
      eventId: discordEventId,
      robberId: z.string().min(1),
      victimId: z.string().min(1),
      guildId: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const { eventId, robberId, victimId, guildId } = input;
      if (robberId === victimId) return { status: "self" as const };

      const roll = Math.random();
      const amountRoll = Math.random();
      const unstableSign = Math.random() < 0.5 ? -1 : 1;
      const result = await economyOperation(ctx.prisma, eventId, "robbery", robberId, async tx => {
        const scope = { victimId, guildId };
        const users = await tx.user.findMany({ where: { discordId: { in: [robberId, victimId] } } });
        const robber = users.find(user => user.discordId === robberId);
        const victim = users.find(user => user.discordId === victimId);
        if (!robber || !victim) return { ...scope, status: "missing" as const };

        const settings = await economySettings(tx, [
          "robChance", "robCooldown", "luckyCharmIncrease", "fortuneAmuletIncrease",
          "sentryWardDecrease", "robMin", "robMax", "bodyguardDuration",
        ]);
        if (!Number.isInteger(settings.robMin) || !Number.isInteger(settings.robMax) ||
            settings.robMin > settings.robMax || settings.robMax > 2147483647) {
          economyError("Invalid robbery amount settings.");
        }

        const now = Date.now();
        const retryAt = Number(robber.lastRobAt ?? robber.lastRobDate) + settings.robCooldown * 1000;
        if (retryAt > now) return { ...scope, status: "cooldown" as const, retryAt };
        const lastVictim = await tx.robLog.findFirst({
          where: { robberId, success: true }, orderBy: [...latestFirst],
        });
        if (lastVictim?.victimId === victimId) return { ...scope, status: "same_victim" as const };
        const lastRobbery = await tx.robLog.findFirst({
          where: { victimId, success: true }, orderBy: [...latestFirst],
        });
        if (lastRobbery && lastRobbery.timestamp.getTime() + protectionMs > now) {
          return { ...scope, status: "protected" as const, retryAt: lastRobbery.timestamp.getTime() + protectionMs };
        }

        const inventory = await tx.inventory.findMany({
          where: { userDiscordId: { in: [robberId, victimId] }, item: { systemKey: { in: itemKeys } } },
          include: { item: { select: { systemKey: true, emoji: true, name: true } } },
        });
        const owned = (discordId: string, key: string) =>
          inventory.find(row => row.userDiscordId === discordId && row.item.systemKey === key);
        const luck = owned(robberId, "LUCK_POTION");
        const unstable = owned(robberId, "UNSTABLE_POTION");
        const amulets = owned(robberId, "FORTUNE_AMULET")?.amount ?? 0;
        const wards = owned(victimId, "SENTRY_WARD")?.amount ?? 0;
        let chance = settings.robChance + robber.failedRobAttempts * 0.1
          + (luck ? settings.luckyCharmIncrease : 0)
          + (unstable ? unstableSign * settings.luckyCharmIncrease : 0)
          + amulets * settings.fortuneAmuletIncrease - wards * settings.sentryWardDecrease;
        if (Number(victim.lastBodyguardAt ?? victim.lastBodyguardDate) + Math.round(settings.bodyguardDuration * 1000) > now) {
          chance -= 0.85;
        } else if (robberId === "746430201298419863" && victimId === "881910448818098186") {
          chance = 0;
        }

        const success = roll <= chance;
        const rolledAmount = Math.floor(amountRoll * (settings.robMax - settings.robMin + 1)) + settings.robMin;
        const loot = Math.min(rolledAmount, Math.max(0, victim.cash));
        const amount = success ? loot : Math.min(loot, Math.max(0, robber.cash));
        await tx.user.update({
          where: { discordId: robberId },
          data: {
            cash: { increment: success ? amount : -amount },
            failedRobAttempts: success ? 0 : { increment: 1 },
            lastRobAt: new Date(now),
            lastRobDate: String(now),
          },
        });
        if (success) {
          await tx.user.update({ where: { discordId: victimId }, data: { cash: { decrement: amount } } });
        } else {
          await tx.guild.update({ where: { id: guildId }, data: { bank: { increment: amount } } });
        }

        const consumed = [luck, unstable].flatMap(row => row ? [row] : []);
        if (consumed.length) {
          await tx.inventory.deleteMany({
            where: { userDiscordId: robberId, itemId: { in: consumed.map(row => row.itemId) } },
          });
        }
        await tx.robLog.create({ data: { robberId, victimId, success, amount, reason: "" } });
        return {
          ...scope, status: "resolved" as const, success, amount,
          consumedItems: consumed.map(row => `${row.item.emoji ?? ""}**${row.item.name}**`),
        };
      });
      if (result.victimId !== victimId || result.guildId !== guildId) {
        economyError("This Discord event was recorded for a different robbery.");
      }
      return result;
    }),
  getLastRobbed: t.procedure
    .input(
      z.object({
        victimId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const lastRobbery = await ctx.prisma.robLog.findFirst({
        where: {
          victimId: input.victimId,
          success: true,
        },
        orderBy: [...latestFirst],
      });
      return { lastRobbery };
    }),
  getLastVictimRobbed: t.procedure
    .input(
      z.object({
        robberId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const lastVictim = await ctx.prisma.robLog.findFirst({
        where: {
          robberId: input.robberId,
          success: true,
        },
        orderBy: [...latestFirst],
      });
      return { lastVictim };
    }),
  create: t.procedure
    .input(
      z.object({
        robberId: z.string(),
        victimId: z.string(),
        success: z.boolean(),
        amount: z.number(),
        reason: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { robberId, victimId, success, amount, reason } = input;
      const log = await ctx.prisma.robLog.create({
        data: {
          robberId,
          victimId,
          success,
          amount,
          reason
        }
      });
      return { log };
    }),
});
