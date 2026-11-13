import { t } from "../trpc";
import { z } from "zod";
import { consumeStock, economyError, economyInteger, economySetting, economyTransaction } from "../economy";

const systemItemKeys = new Map([
  ["fake id", "FAKE_ID"],
  ["bodyguard", "BODYGUARD"],
  ["refresher orb", "REFRESHER_ORB"],
  ["luck potion", "LUCK_POTION"],
  ["unstable potion", "UNSTABLE_POTION"],
  ["fortune amulet", "FORTUNE_AMULET"],
  ["sentry ward", "SENTRY_WARD"],
]);

export const itemRouter = t.router({
  purchase: t.procedure
    .input(z.object({
      userId: z.string().min(1),
      guildId: z.string().min(1),
      itemId: z.number().int(),
      // Refuse a catalog role change between command preflight and payment.
      roleGiven: z.string().nullable(),
    }))
    .mutation(async ({ ctx, input }) => economyTransaction(ctx.prisma, async (tx) => {
      const { userId, guildId, itemId } = input;
      const user = await tx.user.findUnique({ where: { discordId: userId } });
      const item = await tx.item.findUnique({ where: { id: itemId } });
      if (!user || !item) economyError("The user or item no longer exists.");
      if (item.roleGiven !== input.roleGiven) economyError("The item changed. Please try again.");
      const bodyguard = item.systemKey === "BODYGUARD";
      const refresher = item.systemKey === "REFRESHER_ORB";
      const special = bodyguard || refresher;
      const rolePurchase = !special && !!item.roleGiven;
      const key = { userDiscordId_itemId: { userDiscordId: userId, itemId } };
      const owned = await tx.inventory.findUnique({ where: key });
      // A role entitlement is durable across bot restarts and failed Discord
      // requests. Re-delivery never debits cash, bank or stock again.
      if (rolePurchase && owned && owned.amount > 0) {
        return { item, buyPrice: 0, roleGiven: item.roleGiven, recovery: true };
      }
      const buyPrice = item.percentage ? Math.round(user.cash * item.buyPrice / 100) : item.buyPrice;
      if (!Number.isSafeInteger(buyPrice) || buyPrice < 0 || buyPrice > 2147483647) {
        economyError("Invalid item price.");
      }
      if (user.cash < buyPrice) economyError(`You do not have enough money to buy a **${item.name}**!`);
      const now = Date.now();
      if (refresher) {
        const cooldown = await economySetting(tx, "robCooldown");
        if ((now - Number(user.lastRobAt ?? user.lastRobDate)) / 1000 > cooldown) {
          economyError("You can only buy a **Refresher Orb** when `rob` is on cooldown!");
        }
      } else if (bodyguard) {
        const duration = await economySetting(tx, "bodyguardDuration");
        const lastHiredAt = Number(user.lastBodyguardAt ?? user.lastBodyguardDate);
        if (lastHiredAt + Math.round(duration * 1000) > now) {
          economyError("You already have a `Bodyguard`!");
        }
        if (lastHiredAt + 432000000 >= now) {
          economyError(`You can only hire a \`Bodyguard\` every 5 days. Come back <t:${Math.round(lastHiredAt / 1000) + 432000}:R>`);
        }
      } else if (!rolePurchase && !item.stackable && owned) {
        economyError(`You already have a **${item.name}**!`);
      }
      const debit = await tx.user.updateMany({
        where: { discordId: userId, cash: { gte: buyPrice } },
        data: {
          cash: { decrement: buyPrice },
          ...(bodyguard ? { lastBodyguardAt: new Date(now), lastBodyguardDate: String(now) } : {}),
          ...(refresher ? { lastRobAt: null, lastRobDate: "0" } : {}),
        },
      });
      if (debit.count !== 1) economyError("You do not have enough money for this purchase.");
      await consumeStock(tx, itemId);
      if (!special) {
        await tx.inventory.upsert({
          where: key,
          create: { userDiscordId: userId, itemId, amount: 1 },
          update: rolePurchase ? { amount: 1 } : { amount: { increment: 1 } },
        });
      }
      await tx.guild.update({ where: { id: guildId }, data: { bank: { increment: buyPrice } } });
      return { item, buyPrice, roleGiven: rolePurchase ? item.roleGiven : null, recovery: false };
    })),
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
        buyPrice: economyInteger.nonnegative(),
        stock: economyInteger,
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
      const item = await economyTransaction(ctx.prisma, async tx => {
        const key = systemItemKeys.get(name.toLowerCase());
        const canonical = key && await tx.item.findUnique({ where: { systemKey: key }, select: { id: true } });
        return tx.item.create({
          data: { name, emoji, description, buyPrice, stock, stackable, consumable, roleGiven,
            systemKey: canonical ? undefined : key },
        });
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

      const stock = await economyTransaction(ctx.prisma, async (tx) => {
        await consumeStock(tx, id);
        return tx.item.findUnique({ where: { id } });
      });

      return { stock };
    }),
});
