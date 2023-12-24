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
