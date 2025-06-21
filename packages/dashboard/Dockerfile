# packages/dashboard/Dockerfile
FROM node:21-alpine

# Set the working directory inside the container to the root of your logical monorepo structure
WORKDIR /app

# 1. Copy root package.json and lock file first
COPY package*.json ./

# 2. Copy ALL workspace package.json and lock files
# This ensures npm has visibility into all defined workspaces
COPY packages/*/package*.json ./packages/*/
# If you have nested directories for packages (e.g. packages/foo/bar/package.json) you'd need:
# COPY packages/*/*/package*.json ./packages/*/*/ # (Adjust as needed for your specific depth)

COPY patches/ ./patches/

# 3. Copy other internal packages that the dashboard depends on (e.g., @bbc-bot/api)
COPY packages/api ./packages/api/
COPY packages/node ./packages/node/
COPY packages/react ./packages/react/
# ... any other packages that your dashboard imports directly (e.g., packages/common)

# 4. Copy the .env file from the monorepo root
COPY .env ./.env

# 5. Copy the dashboard's specific application code (excluding package.json already copied)
# This copies the dashboard's source code into its logical location within the monorepo structure in the container
COPY packages/dashboard/ ./.

# 6. Install ALL monorepo production dependencies
# This is the key change. We run `npm ci` in the root WORKDIR (/app)
# This will install and link dependencies for all workspaces.
RUN npm ci --production

# 7. Build the dashboard for production
# Run from /app, but targeting the specific workspace.
RUN npm run build --prefix packages/dashboard

EXPOSE 3000 

CMD ["npm", "run", "dev"]