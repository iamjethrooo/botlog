-- CreateTable
CREATE TABLE "RobLog" (
    "id" SERIAL NOT NULL,
    "robberId" TEXT NOT NULL,
    "victimId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "amount" INTEGER,
    "reason" TEXT,

    CONSTRAINT "RobLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RobLog_robberId_victimId_idx" ON "RobLog"("robberId", "victimId");
