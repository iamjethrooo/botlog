-- CreateTable
CREATE TABLE "Giveaway" (
    "giveawayId" TEXT NOT NULL,
    "prize" TEXT NOT NULL,
    "numOfWinners" INTEGER NOT NULL DEFAULT 1,
    "numOfEntries" INTEGER NOT NULL DEFAULT 1,
    "duration" TEXT NOT NULL,
    "dateStarted" TEXT NOT NULL,

    CONSTRAINT "Giveaway_pkey" PRIMARY KEY ("giveawayId")
);

-- CreateTable
CREATE TABLE "GiveawayEntry" (
    "id" SERIAL NOT NULL,
    "giveawayId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "GiveawayEntry_pkey" PRIMARY KEY ("id")
);
