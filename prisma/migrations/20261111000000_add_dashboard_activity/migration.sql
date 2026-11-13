-- CreateEnum
CREATE TYPE "DashboardActivityKind" AS ENUM ('COMMAND_TOGGLE', 'COMMAND_PERMISSIONS', 'VOICE_HUB');

-- CreateTable
CREATE TABLE "DashboardActivity" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "actorDiscordId" TEXT NOT NULL,
    "actorName" TEXT,
    "kind" "DashboardActivityKind" NOT NULL,
    "commandName" TEXT,
    "before" JSONB NOT NULL,
    "after" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DashboardActivity_guildId_createdAt_id_idx" ON "DashboardActivity"("guildId", "createdAt", "id");
