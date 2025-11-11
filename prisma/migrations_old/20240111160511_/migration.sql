/*
  Warnings:

  - You are about to drop the column `heistAdditionalChancePerMember` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `heistAdditionalRatePerMember` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `heistBaseChance` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `heistBaseRate` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `heistCooldown` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `heistJailTime` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `heistJailTimeReduction` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `heistMaxMembers` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `heistWaitingTime` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `interval` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `maxCashPerChat` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `minCashPerChat` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `robChance` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `robChanceMod` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `robChanceThief` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `robCooldown` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `robCooldownThief` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `robRate` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `robRateThief` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `robTaxMod` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `singleSnipeCost` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `snipeCostIncrease` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `starboardCost` on the `Guild` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Guild" DROP COLUMN "heistAdditionalChancePerMember",
DROP COLUMN "heistAdditionalRatePerMember",
DROP COLUMN "heistBaseChance",
DROP COLUMN "heistBaseRate",
DROP COLUMN "heistCooldown",
DROP COLUMN "heistJailTime",
DROP COLUMN "heistJailTimeReduction",
DROP COLUMN "heistMaxMembers",
DROP COLUMN "heistWaitingTime",
DROP COLUMN "interval",
DROP COLUMN "maxCashPerChat",
DROP COLUMN "minCashPerChat",
DROP COLUMN "robChance",
DROP COLUMN "robChanceMod",
DROP COLUMN "robChanceThief",
DROP COLUMN "robCooldown",
DROP COLUMN "robCooldownThief",
DROP COLUMN "robRate",
DROP COLUMN "robRateThief",
DROP COLUMN "robTaxMod",
DROP COLUMN "singleSnipeCost",
DROP COLUMN "snipeCostIncrease",
DROP COLUMN "starboardCost";
