# Stage 1: Dependencies - Install monorepo dependencies
FROM node:21 AS deps

WORKDIR /app

# Copy package.json and package-lock.json for dependency installation
COPY . .

# Install all monorepo dependencies
RUN npm ci

# Stage 2: Builder - Build the Next.js application
FROM node:21 AS builder

WORKDIR /app

COPY --from=deps /app/package.json ./
COPY --from=deps /app/package-lock.json ./

# Copy node_modules from the dependency stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/dashboard/node_modules ./packages/dashboard/node_modules
COPY --from=deps /app/prisma ./prisma

# Copy dashboard source code
COPY packages/dashboard ./packages/dashboard

COPY packages/api ./packages/api
COPY packages/node ./packages/node
COPY packages/react ./packages/react



ENV NEXT_TELEMETRY_DISABLED 1
# Build the Next.js application
RUN npm run build --prefix packages/dashboard

# Stage 3: Runner - The final, optimized runtime image
FROM node:21-slim

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=deps /app/node_modules ./node_modules

# Copy standalone output from the builder stage
# Ensure you have 'output: 'standalone'' in next.config.mjs
COPY --from=builder /app/packages/dashboard/.next/standalone ./
COPY --from=builder /app/packages/dashboard/.next/static ./packages/dashboard/.next/static
COPY --from=builder /app/packages/dashboard ./packages/dashboard

COPY --from=builder /app/packages/api ./app/packages/api
COPY --from=builder /app/packages/node ./app/packages/node
COPY --from=builder /app/packages/react ./app/packages/react

COPY --from=builder /app/prisma ./prisma

# If your dashboard needs the generated Prisma client at runtime, ensure it's copied
COPY --from=builder /app/prisma ./prisma

# NEW: Copy the root package.json and package-lock.json
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

EXPOSE 3000

CMD ["npm", "run", "dev:dashboard"]