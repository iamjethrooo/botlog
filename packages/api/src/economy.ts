import type { Prisma, PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const economyInteger = z.number().int().min(-2147483648).max(2147483647);

// Only retry errors that guarantee the transaction was rolled back. Never retry
// transport/commit-unknown errors, and never put Discord side effects here.
export async function economyTransaction<T>(
  prisma: PrismaClient,
  operation: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(operation, { isolationLevel: "Serializable" });
    } catch (error) {
      const code = (error as { code?: string }).code;
      // P2002 can occur when concurrent transfers create the same recipient or
      // concurrent purchases create the same compound inventory key.
      if (attempt >= 2 || (code !== "P2034" && code !== "P2002")) throw error;
    }
  }
}

export function economyError(message: string): never {
  throw new TRPCError({ code: "BAD_REQUEST", message });
}

export async function economySetting(tx: Prisma.TransactionClient, key: string) {
  const setting = await tx.setting.findUnique({ where: { settingKey: key } });
  return economySettingNumber(key, setting?.settingValue);
}

function economySettingNumber(key: string, text?: string, allowNegative = false) {
  const value = Number(text);
  if (!text?.trim() || !Number.isFinite(value) || (!allowNegative && value < 0)) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Invalid economy setting: ${key}` });
  }
  return value;
}

export async function economySettings<K extends string>(
  tx: Prisma.TransactionClient,
  keys: readonly K[],
  signedKeys: readonly K[] = [],
) {
  const rows = await tx.setting.findMany({ where: { settingKey: { in: [...keys] } } });
  const values = new Map(rows.map(row => [row.settingKey, row.settingValue]));
  return Object.fromEntries(keys.map(key => [key, economySettingNumber(key, values.get(key), signedKeys.includes(key))])) as Record<K, number>;
}

export const discordEventId = z.string().regex(/^\d{17,20}$/);

export async function economyOperation<T extends Prisma.InputJsonObject>(
  prisma: PrismaClient,
  eventId: string,
  kind: string,
  userDiscordId: string,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return economyTransaction(prisma, async tx => {
    const previous = await tx.economyOperation.findUnique({ where: { kind_eventId: { kind, eventId } } });
    if (previous) {
      if (previous.userDiscordId !== userDiscordId) {
        throw new TRPCError({ code: "CONFLICT", message: "This Discord event was already recorded." });
      }
      return previous.result as T;
    }

    const result = await operation(tx);
    await tx.economyOperation.create({ data: { eventId, kind, userDiscordId, result } });
    return result;
  });
}

// Keep the old string fields in sync during the migration and rollback window.
export const legacyCooldownDate = z.string().trim().regex(/^\d{1,15}$/)
  .refine(value => Number(value) <= 253402300799000, "Invalid epoch milliseconds");

export function cooldownDate(value: string) {
  const millis = Number(value);
  return millis === 0 ? null : new Date(millis);
}

export async function consumeStock(tx: Prisma.TransactionClient, itemId: number) {
  const stock = await tx.item.updateMany({
    where: { id: itemId, stock: { gt: 0 } },
    data: { stock: { decrement: 1 } },
  });
  if (stock.count === 0) {
    const item = await tx.item.findUnique({ where: { id: itemId } });
    if (!item || item.stock >= 0) economyError("This item is sold out.");
    // Negative stock is an unlimited-stock sentinel, not a counter.
  }
}
