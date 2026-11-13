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
