/*
  Warnings:

  - You are about to drop the column `bank` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Guild" ADD COLUMN     "bank" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "bank";
