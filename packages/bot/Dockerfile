FROM node:22-bookworm AS build
WORKDIR /app
# canvas 2 uses a native build on Node 22; build and runtime both use glibc.
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
RUN npx --no-install prisma generate && npm run build --workspace bbc-bot \
    && npm run copy-scripts --workspace bbc-bot \
    && npm prune --omit=dev --ignore-scripts --no-audit --no-fund

FROM node:22-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libjpeg62-turbo libgif7 librsvg2-2 fontconfig fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY docker ./docker
RUN mkdir -p /app/packages/bot/data && chown node:node /app/packages/bot/data \
    && install -m 644 packages/bot/src/fonts/*.ttf /usr/local/share/fonts/ && fc-cache -f
WORKDIR /app/packages/bot
USER node
CMD ["node", "/app/docker/bot-start.cjs"]