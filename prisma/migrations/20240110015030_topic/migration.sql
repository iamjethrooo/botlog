-- CreateTable
CREATE TABLE "Topic" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "messageContent" TEXT NOT NULL DEFAULT '',
    "lastSentAt" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);
