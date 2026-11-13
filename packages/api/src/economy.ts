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
  const value = Number(setting?.settingValue);
  if (!setting || !Number.isFinite(value) || value < 0) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Invalid economy setting: ${key}` });
  }
  return value;
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
