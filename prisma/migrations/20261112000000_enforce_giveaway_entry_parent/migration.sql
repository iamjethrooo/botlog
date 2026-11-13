BEGIN;

CREATE INDEX "GiveawayEntry_giveawayId_userId_idx" ON "GiveawayEntry"("giveawayId", "userId");

ALTER TABLE "GiveawayEntry"
    ADD CONSTRAINT "GiveawayEntry_giveawayId_fkey"
    FOREIGN KEY ("giveawayId") REFERENCES "Giveaway"("giveawayId")
    ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
