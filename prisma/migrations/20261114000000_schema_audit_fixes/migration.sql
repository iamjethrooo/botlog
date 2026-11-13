BEGIN;

CREATE INDEX "Account_userId_idx" ON "Account" ("userId");
CREATE INDEX "Session_userId_idx" ON "Session" ("userId");
CREATE INDEX "Inventory_itemId_idx" ON "Inventory" ("itemId");
CREATE INDEX "Reminder_userId_id_idx" ON "Reminder" ("userId", id);
CREATE INDEX "Guild_ownerId_idx" ON "Guild" ("ownerId");

UPDATE "Guild" SET "notifyList" = '{}' WHERE "notifyList" IS NULL;
UPDATE "Guild" SET disabled_commands = '{}' WHERE disabled_commands IS NULL;
ALTER TABLE "Guild"
    ALTER COLUMN "notifyList" SET DEFAULT '{}',
    ALTER COLUMN "notifyList" SET NOT NULL,
    ALTER COLUMN disabled_commands SET DEFAULT '{}',
    ALTER COLUMN disabled_commands SET NOT NULL;

CREATE UNIQUE INDEX "TempChannel_guildId_ownerId_key" ON "TempChannel" ("guildId", "ownerId");
DROP INDEX "TempChannel_ownerId_key";
ALTER TABLE "TempChannel" DROP CONSTRAINT "TempChannel_guildId_fkey";
ALTER TABLE "TempChannel" ADD CONSTRAINT "TempChannel_guildId_fkey"
    FOREIGN KEY ("guildId") REFERENCES "Guild"(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "User"
    ADD COLUMN "lastMessageRewardAt" TIMESTAMPTZ(3),
    ADD COLUMN "lastRobAt" TIMESTAMPTZ(3),
    ADD COLUMN "lastHeistAt" TIMESTAMPTZ(3),
    ADD COLUMN "lastCoinFlipAt" TIMESTAMPTZ(3),
    ADD COLUMN "lastBodyguardAt" TIMESTAMPTZ(3),
    ADD COLUMN "jailDurationSeconds" INTEGER;
ALTER TABLE "Reminder" ADD COLUMN "scheduledAt" TIMESTAMPTZ(3);
ALTER TABLE "Giveaway"
    ADD COLUMN "startedAt" TIMESTAMPTZ(3),
    ADD COLUMN "endsAtTimestamp" TIMESTAMPTZ(3),
    ADD COLUMN "entryFeeCoins" INTEGER CHECK ("entryFeeCoins" >= 0),
    ADD COLUMN "guildId" TEXT,
    ADD COLUMN "channelId" TEXT;
ALTER TABLE "Giveaway" ADD CONSTRAINT "Giveaway_location_pair"
    CHECK (("guildId" IS NULL) = ("channelId" IS NULL));

-- Keep unreadable legacy values in their original columns for review.
CREATE FUNCTION pg_temp.epoch_instant(value TEXT, units_per_second INT)
RETURNS TIMESTAMPTZ LANGUAGE sql AS $$
    SELECT CASE WHEN btrim(value) ~ '^[0-9]{1,15}$'
        THEN CASE WHEN btrim(value)::numeric BETWEEN 1 AND 253402300799 * units_per_second::numeric
            THEN to_timestamp(btrim(value)::double precision / units_per_second) END
        END;
$$;

CREATE FUNCTION pg_temp.legacy_integer(value TEXT)
RETURNS INTEGER LANGUAGE sql AS $$
    SELECT CASE WHEN btrim(value) ~ '^-?[0-9]{1,10}$'
        THEN CASE WHEN btrim(value)::bigint BETWEEN -2147483648 AND 2147483647
            THEN btrim(value)::integer END
        END;
$$;

CREATE FUNCTION pg_temp.reminder_instant(value TEXT)
RETURNS TIMESTAMPTZ LANGUAGE plpgsql AS $$
BEGIN
    IF btrim(value) ~ '^[0-9]{11,15}$' THEN
        RETURN pg_temp.epoch_instant(value, 1000);
    END IF;
    IF btrim(value) ~ '^([0-9]{4}-[0-9]{2}-[0-9]{2})T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,3})?(Z|[+-][0-9]{2}:[0-9]{2})$' THEN
        RETURN btrim(value)::timestamptz;
    END IF;
    RETURN NULL;
EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow OR invalid_time_zone_displacement_value THEN
    RETURN NULL;
END;
$$;

UPDATE "User" SET
    "lastMessageRewardAt" = pg_temp.epoch_instant("lastMessageDate", 1000),
    "lastRobAt" = pg_temp.epoch_instant("lastRobDate", 1000),
    "lastHeistAt" = pg_temp.epoch_instant("lastHeistDate", 1000),
    "lastCoinFlipAt" = pg_temp.epoch_instant("lastCoinFlipDate", 1000),
    "lastBodyguardAt" = pg_temp.epoch_instant("lastBodyguardDate", 1000),
    "jailDurationSeconds" = pg_temp.legacy_integer("jailTime");
UPDATE "Reminder" SET "scheduledAt" = pg_temp.reminder_instant("dateTime");
UPDATE "Giveaway" SET
    "startedAt" = pg_temp.epoch_instant("dateStarted", 1),
    "endsAtTimestamp" = pg_temp.epoch_instant("endsAt", 1000),
    "entryFeeCoins" = NULLIF(GREATEST(pg_temp.legacy_integer("entryFee"), -1), -1);

ALTER TABLE "Item" ADD COLUMN "systemKey" TEXT;
WITH system_items(name, key) AS (VALUES
    ('fake id', 'FAKE_ID'),
    ('bodyguard', 'BODYGUARD'),
    ('refresher orb', 'REFRESHER_ORB'),
    ('luck potion', 'LUCK_POTION'),
    ('unstable potion', 'UNSTABLE_POTION'),
    ('fortune amulet', 'FORTUNE_AMULET'),
    ('sentry ward', 'SENTRY_WARD')
), canonical AS (
    SELECT min(item.id) AS id, system_items.key
    FROM "Item" item JOIN system_items ON lower(item.name) = system_items.name
    GROUP BY system_items.key
)
UPDATE "Item" item SET "systemKey" = canonical.key FROM canonical WHERE item.id = canonical.id;
CREATE UNIQUE INDEX "Item_systemKey_key" ON "Item" ("systemKey");

CREATE INDEX "RobLog_victimId_success_timestamp_id_idx"
    ON "RobLog" ("victimId", success, timestamp DESC, id DESC);
CREATE INDEX "RobLog_robberId_success_timestamp_id_idx"
    ON "RobLog" ("robberId", success, timestamp DESC, id DESC);
CREATE INDEX "HoldupLog_victimId_success_timestamp_id_idx"
    ON "HoldupLog" ("victimId", success, timestamp DESC, id DESC);
CREATE INDEX "HoldupLog_participants_idx" ON "HoldupLog" USING GIN (participants jsonb_path_ops);
DROP INDEX "RobLog_robberId_victimId_idx";

CREATE TABLE "EconomyOperation" (
    "eventId" TEXT NOT NULL,
    kind TEXT NOT NULL,
    "userDiscordId" TEXT NOT NULL,
    result JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EconomyOperation_pkey" PRIMARY KEY (kind, "eventId")
);

COMMIT;
