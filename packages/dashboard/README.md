# Botlog dashboard

This workspace contains the Next.js Pages Router dashboard, Discord OAuth, and the `/api/trpc` API backed by Prisma. It runs with the bot and Redis in the root Docker Compose stack. Neon PostgreSQL and Lavalink are external services. See the [production setup](../../README.md).

The development OAuth callback is `http://127.0.0.1:3001/api/auth/callback/discord`. The production Docker callback uses port `3000`. The bot and server-side requests inside Compose use `http://dashboard:3000`.

For local development, supply development-only values in the root .env; the root npm run dev copies them into this workspace. For Docker, place a filled copy of docker/dashboard.env.example outside the checkout. Compose injects the public and internal URLs; the runtime file supplies the intended Neon DATABASE_URL, Discord OAuth credentials, auth secret, and bot API token. No runtime shadow URL or database migration belongs in image build/startup.
