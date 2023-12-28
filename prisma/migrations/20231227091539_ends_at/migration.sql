/*
  Warnings:

  - You are about to drop the column `duration` on the `Giveaway` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Giveaway" DROP COLUMN "duration",
ADD COLUMN     "endsAt" TEXT NOT NULL DEFAULT '0';
