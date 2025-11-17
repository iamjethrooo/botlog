-- CreateTable
CREATE TABLE "HoldupLog" (
    "id" SERIAL NOT NULL,
    "victimId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "participants" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "totalLoot" INTEGER,

    CONSTRAINT "HoldupLog_pkey" PRIMARY KEY ("id")
);
