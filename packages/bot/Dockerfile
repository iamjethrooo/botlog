# packages/bot/Dockerfile
FROM node:21-alpine 

# Set the working directory inside the container
WORKDIR /app

# 1. Install build dependencies for native modules like 'canvas'
RUN apk add --no-cache python3 make g++ libc6-compat \
    && apk add --no-cache pixman-dev cairo-dev pango-dev libjpeg-turbo-dev giflib-dev \
    && rm -rf /var/cache/apk/*

# 2. Copy root package.json and lock file for workspace context
COPY package*.json ./

# 3. Copy ALL workspace package.json and lock files
COPY packages/*/package*.json ./packages/*/
# (Adjust for nested workspace paths if necessary)

COPY patches/ ./patches/

# 4. Copy other internal packages that the bot depends on (if any, e.g. packages/api)
# COPY packages/api ./packages/api/ # Example if your bot uses packages/api
# ...

# 5. Copy the .env file from the monorepo root
COPY .env ./.env

# 6. Copy the rest of your bot's application code
COPY packages/bot/ ./.

# 7. Install ALL monorepo production dependencies
# This is the key change for the bot as well
RUN npm ci --production

CMD ["npm", "run", "dev"] 