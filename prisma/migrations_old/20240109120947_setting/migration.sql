-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "settingKey" TEXT NOT NULL,
    "settingValue" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);
