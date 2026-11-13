# Botlog

Botlog is a Discord bot with a web dashboard for server administration.

## Technologies

| Component | Stack |
| --- | --- |
| Discord bot | Node.js 22, TypeScript, discord.js, Sapphire Framework |
| Web dashboard | Next.js (Pages Router), React, Tailwind CSS, NextAuth.js with Discord OAuth |
| API and data | tRPC, Prisma, Neon PostgreSQL, Redis |
| Audio integration | Lavalink |
| Production release | Docker Compose on Windows Docker Desktop |

## Production setup

Production runs the bot, dashboard, and Redis in the `botlog-production` Docker Compose project. Before updating it, verify backups and keep the currently deployed manifest for rollback.

Docker records the checkout used to launch Compose in its project labels. A
label pointing at `botlog-dev` identifies the location of the Compose files.
The release overlay runs pinned images with production runtime files and named
volumes. It does not mount source code from that checkout.

1. Install Node.js 22 and use Docker Desktop in Linux container mode with Docker Engine 28+ and Compose 2.30+.
2. Fill in private copies of the [bot environment template](docker/bot.env.example) and [dashboard environment template](docker/dashboard.env.example) outside the checkout. Use the reviewed production Discord application, server, channel IDs, and Lavalink settings for the bot. Configure the dashboard with the production Neon URL, Discord OAuth credentials, and `NEXTAUTH_SECRET`. Use the same bot token in the bot file and in both dashboard token fields. Apply the release's required database migrations through the approved migration workflow before startup.
3. Confirm that the production Discord application has `http://127.0.0.1:3000/api/auth/callback/discord` registered as an OAuth2 redirect.
4. Copy the [release manifest template](docker/releases.example.json) to a private location. Fill in both environment entries with absolute paths to their separate runtime files and reviewed local SHA-256 image IDs for the bot, dashboard, and Redis. Retain the previous release manifest and images for rollback.

Before applying migrations, check the target migration history and count
orphaned giveaway entries, negative inventory quantities, and negative item
prices. Resolve any violations before migrating. Rehearse the backup and
restore on disposable PostgreSQL with `node scripts/postgres-recovery-rehearsal.cjs`.

The schema maintenance migration `20261114000000_schema_audit_fixes` adds
typed giveaway dates and fees, typed cooldown dates, reminder timestamps, and
stable keys for special shop items. It also adds the indexes for robbery and
holdup cooldown lookups. Rehearse the migration with representative table sizes
before scheduling it. The backfills and index builds run in one transaction
and can block writers while it runs.

- Apply the migration before switching the bot and API to the new release.
  The new API writes both legacy and typed fields so existing callers can keep
  using their original payloads. If you roll back to an older API and resume
  writes, reconcile typed dates against their legacy columns before switching
  forward again. Keep the legacy columns until the rollback window closes and
  unresolved legacy values have been reviewed.
- For older giveaways, the bot verifies the original message in the configured
  channel before saving its location. Review active rows whose location cannot
  be verified, or whose typed deadline or fee could not be backfilled. Recover
  the original guild and channel from the Discord message before filling both
  IDs. Legacy reminders with ambiguous dates retain their original text.
- The backfill assigns a special item key to the lowest item ID when multiple
  names match case insensitively. Review catalog collisions and check that the
  chosen row owns the intended inventory before rollout. Change display names
  independently of these keys after migration.
- Temporary channel records are unique per guild and owner, and are deleted
  when the guild record is deleted. Deleting a user removes their auth accounts,
  sessions, and inventory. Guild ownership and reminders restrict user deletion.
  Giveaway entries restrict deletion of their giveaway and can include multiple
  tickets for one Discord user. Activity, robbery, holdup, and economy operation
  records retain their Discord IDs independently of live user and guild rows.
- PostgreSQL checks require nonnegative inventory quantities, item prices, and
  typed giveaway fees. The migration SQL defines these checks. Signed balances
  and negative stock for unlimited items are intentional. An economy operation
  records the result of a chat reward or robbery by operation type and Discord
  event ID, so redelivery can recover the result without applying the write again.
Keep real backups and manifests in protected storage outside the checkout.

## Run the production release

From the repository root, validate the release configuration using the path to your private manifest.

```powershell
node scripts/deployment.cjs check C:/private/botlog/releases.json production
```

After the production update is approved, apply the reviewed images to the existing Compose project and check their status.

```powershell
node scripts/deployment.cjs up C:/private/botlog/releases.json production --approved-start --approved-production-action
node scripts/deployment.cjs status C:/private/botlog/releases.json production
```

Open <http://127.0.0.1:3000> and sign in with a Discord account that owns the server or has Administrator permission. Use `logs` with the same manifest and environment to inspect startup. For an approved stop, use `stop` with `--approved-production-action`. To roll back a Docker release, run the approved `up` command with the previous manifest after checking that its images are compatible with the current database schema.

The dashboard checks its Prisma migration history at startup. Use
`/api/live` for recurring monitoring and `/api/health` for an on-demand
database check. Release the bot and dashboard together so both use the same
liveness route.
