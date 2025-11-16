-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "discordId" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "timeOffset" INTEGER,
    "failedRobAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastMessageDate" TEXT NOT NULL DEFAULT '0',
    "lastRobDate" TEXT NOT NULL DEFAULT '0',
    "lastHeistDate" TEXT NOT NULL DEFAULT '0',
    "lastCoinFlipDate" TEXT NOT NULL DEFAULT '0',
    "lastBodyguardDate" TEXT NOT NULL DEFAULT '0',
    "jailTime" TEXT NOT NULL DEFAULT '0',
    "cash" INTEGER NOT NULL DEFAULT 0,
    "birthday" TEXT NOT NULL DEFAULT '0',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "added" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "volume" INTEGER NOT NULL DEFAULT 100,
    "notifyList" TEXT[],
    "ownerId" TEXT NOT NULL,
    "bank" INTEGER NOT NULL DEFAULT 0,
    "thievesBank" INTEGER NOT NULL DEFAULT 0,
    "disabled_commands" TEXT[],
    "log_channel" TEXT,
    "welcome_message_channel" TEXT,
    "welcome_message" TEXT,
    "welcome_message_enabled" BOOLEAN NOT NULL DEFAULT false,
    "hub" TEXT,
    "hub_channel" TEXT,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "settingKey" TEXT NOT NULL,
    "settingValue" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "messageContent" TEXT NOT NULL DEFAULT '',
    "lastSentAt" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TempChannel" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "TempChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repeat" TEXT,
    "event" TEXT NOT NULL,
    "description" TEXT,
    "dateTime" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timeOffset" INTEGER NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT,
    "description" TEXT,
    "stackable" BOOLEAN NOT NULL DEFAULT false,
    "consumable" BOOLEAN NOT NULL DEFAULT true,
    "buyPrice" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "roleGiven" TEXT,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "userId" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("userId","itemId")
);

-- CreateTable
CREATE TABLE "StarboardMessage" (
    "messageId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,

    CONSTRAINT "StarboardMessage_pkey" PRIMARY KEY ("messageId")
);

-- CreateTable
CREATE TABLE "NicknameChangeRequest" (
    "id" SERIAL NOT NULL,
    "requesterId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "newNickname" TEXT NOT NULL,
    "expires_at" TEXT NOT NULL,

    CONSTRAINT "NicknameChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNickname" (
    "userId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,

    CONSTRAINT "UserNickname_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Giveaway" (
    "messageId" TEXT NOT NULL DEFAULT '',
    "giveawayId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL DEFAULT '',
    "prize" TEXT NOT NULL,
    "numOfWinners" INTEGER NOT NULL DEFAULT 1,
    "numOfEntries" INTEGER NOT NULL DEFAULT 1,
    "entryFee" TEXT NOT NULL DEFAULT '0',
    "endsAt" TEXT NOT NULL DEFAULT '0',
    "dateStarted" TEXT NOT NULL,
    "ended" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Giveaway_pkey" PRIMARY KEY ("giveawayId")
);

-- CreateTable
CREATE TABLE "GiveawayEntry" (
    "id" SERIAL NOT NULL,
    "giveawayId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "GiveawayEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_settingKey_key" ON "Setting"("settingKey");

-- CreateIndex
CREATE UNIQUE INDEX "TempChannel_ownerId_key" ON "TempChannel"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_name_key" ON "Item"("name");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild" ADD CONSTRAINT "Guild_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("discordId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TempChannel" ADD CONSTRAINT "TempChannel_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("discordId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("discordId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

