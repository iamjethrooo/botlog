/*
  Warnings:

  - You are about to drop the `StarboardMessages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "StarboardMessages";

-- CreateTable
CREATE TABLE "StarboardMessage" (
    "messageId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,

    CONSTRAINT "StarboardMessage_pkey" PRIMARY KEY ("messageId")
);
