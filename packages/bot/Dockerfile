# Stage 1: Builder
FROM node:21 AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    libwebp-dev \
    libpixman-1-dev \
    pkg-config \
    python3 \
    make \
    g++ \
    openssl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy package.json and package-lock.json for dependency installation
COPY package.json package-lock.json ./
COPY packages/bot/package.json ./packages/bot/
COPY packages/api/package.json ./packages/api/
# Install all monorepo dependencies using npm ci
RUN npm ci

# Copy the rest of the monorepo source code
COPY . .

RUN npx prisma db push --schema=./prisma/schema.prisma
RUN npx prisma generate --schema=./prisma/schema.prisma


# Build the bot application
RUN npm run build --prefix packages/bot

# --- Stage 2: Runtime ---
FROM node:21-slim

WORKDIR /app

# Copy necessary system dependencies if needed by runtime (adjust list based on your needs)
# Example: If @napi-rs/canvas needs libcairo.so.2 at runtime:
# COPY --from=builder /usr/lib/x86_64-linux-gnu/libcairo.so.2 /usr/lib/x86_64-linux-gnu/
# Add more as required by your specific native modules

# Install PM2 globally (PM2 is needed at runtime)
RUN npm install -g pm2

# Copy only the built bot application and its production dependencies
COPY --from=builder /app/packages/bot/dist ./packages/bot/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/bot ./packages/bot

# Copy scripts directory if it's external to dist
COPY --from=builder /app/packages/bot/scripts ./packages/bot/scripts

COPY --from=builder /app/packages/api ./packages/api

# Copy Prisma related files needed at runtime (e.g., generated client)
COPY --from=builder /app/prisma ./prisma

# NEW: Copy the root package.json and package-lock.json
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

ENV DASHBOARD_URL=http://dashboard:3000

CMD ["npm", "run", "dev:bot"]