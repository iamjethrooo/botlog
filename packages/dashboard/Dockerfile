FROM node:22-bookworm AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ pkg-config libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/node/package.json ./packages/node/
COPY packages/react/package.json ./packages/react/
COPY packages/bot/package.json ./packages/bot/
COPY packages/dashboard/package.json ./packages/dashboard/
COPY patches ./patches
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN npm ci --no-audit --no-fund
COPY packages ./packages
COPY docker ./docker
# Only public configuration is a build argument. Validators receive dummy
# values for this RUN only. Generation/build do not connect to PostgreSQL.
ARG NEXT_PUBLIC_INVITE_URL=https://discord.com/
RUN npx --no-install prisma generate \
    && NEXTAUTH_SECRET=build-only-not-a-runtime-secret NEXTAUTH_URL=http://127.0.0.1:3000 \
       DISCORD_CLIENT_ID=build-only DISCORD_CLIENT_SECRET=build-only \
       DATABASE_URL=postgresql://build:build@127.0.0.1:1/build \
       NEXT_PUBLIC_INVITE_URL=$NEXT_PUBLIC_INVITE_URL NEXT_TELEMETRY_DISABLED=1 \
       npm run build --workspace dashboard -- --no-lint \
    && npm prune --omit=dev --ignore-scripts --no-audit --no-fund

FROM node:22-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY prisma/migrations ./prisma/migrations
COPY docker ./docker
USER node
WORKDIR /app/packages/dashboard
CMD ["node", "/app/docker/dashboard-start.cjs"]
