# Botlog
A Discord Bot written in TypeScript using Sapphire, discord.js, Next.js and React

[![image](https://img.shields.io/badge/language-typescript-blue)](https://www.typescriptlang.org)
[![image](https://img.shields.io/badge/node-%3E%3D%2016.0.0-blue)](https://nodejs.org/)

## System dependencies

- [Node.js LTS or latest](https://nodejs.org/en/download/)

## Setup bot
### PostgreSQL

#### Linux

Either from the official site or follow the tutorial for your [distro](https://www.digitalocean.com/community/tutorial_collections/how-to-install-and-use-postgresql).

#### MacOS

Get [brew](https://brew.sh), then enter 'brew install postgresql'.

#### Windows

Download from [here](https://www.postgresql.org/download/windows/)

### Redis

#### MacOS

`brew install redis`.

#### Windows

Download from [here](https://redis.io/download/).

#### Linux

Follow the instructions [here](https://redis.io/docs/getting-started/installation/install-redis-on-linux/).

### Settings (env)

Create a `.env` file in the root directory and copy the contents of .env.example to it.
Note: if you are not hosting postgres on Heroku you do not need the SHADOW_DB_URL variable.

```env
# DB URL
DATABASE_URL="postgresql://john:doe@localhost:5432/master-bot?schema=public"
SHADOW_DB_URL="postgresql://john:doe@localhost:5432/master-bot?schema=public"

GUILD_ID=

# ECONOMY
COIN_NAME=""
COIN_EMOJI=""
RED_COLOR="F5463D"
GREEN_COLOR="3DF556"

CASH_PER_CHAT=1
MIN_CASH_PER_CHAT=5
MAX_CASH_PER_CHAT=12
STARTING_CASH=200
INTERVAL=60

SNIPE_COST=200
SINGLE_SNIPE_COST=100

ROB_CHANCE=0.33
ROB_CHANCE_THIEF=0.55
ROB_CHANCE_MOD=0.51

ROB_RATE=0.04
ROB_RATE_THIEF=0.07

# 6 hours
ROB_COOLDOWN=21600
# 3 hours
ROB_COOLDOWN_THIEF=10800

ROLE_ID_THIEF=
ROLE_ID_INMATE=

HEIST_WAITING_TIME=180
HEIST_JAIL_TIME=86400
HEIST_REDUCED_JAIL_TIME=7200

HEIST_BASE_CHANCE=0.15
HEIST_ADDITIONAL_CHANCE=0.0375

HEIST_BASE_RATE=0.15
HEIST_ADDITIONAL_RATE=0.025

HEIST_MAX_MEMBERS=5
HEIST_COOLDOWN=604800

COINFLIP_COOLDOWN=600

# Bot Token
# DISCORD_TOKEN=""
DISCORD_TOKEN=""
CAT_API=""
DOG_API=""
CLIENT_ID=""
CLIENT_SECRET=""
PREFIX=""
RAWG_API=""
TENOR_API=""
WEATHER_API=""
YOUTUBE_API=""

# Next Auth
NEXTAUTH_SECRET="somesupersecrettwelvelengthword"
NEXTAUTH_URL=http://domain:3000
NEXTAUTH_URL_INTERNAL=http://localhost:3000
NEXT_PUBLIC_INVITE_URL="https://discord.com/api/oauth2/authorize?client_id=yourclientid&permissions=8&scope=bot"

# Next Auth Discord Provider
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""

# Spotify
SPOTIFY_CLIENT_ID=""
SPOTIFY_CLIENT_SECRET=""

# Lavalink
LAVA_HOST=""
LAVA_PASS=""
LAVA_PORT=
LAVA_SECURE=

# Redis
REDIS_HOST="127.0.0.1"
REDIS_PORT=6379
REDIS_PASSWORD=""
REDIS_DB=1

# ChatGPT
SESSION_TOKEN=""
```

#### Gif features

If you have no use in the gif commands, leave everything under 'Other APIs' empty. Same applies for Twitch, everything else is needed.

#### DB URL

Change 'john' to your pc username and 'doe' to some password, or set the name and password you created when you installed Postgres.

#### Bot Token

Generate a token in your Discord developer portal.

#### Next Auth

You can leave everything as is, just change 'yourclientid' in NEXT_PUBLIC_INVITE_URL to your Discord bot id and then change 'domain' in NEXTAUTH_URL to your domain or public ip. You can find your public ip by going to [www.whatismyip.com](https://www.whatismyip.com/).

#### Next Auth Discord Provider

Go to the OAuth2 tab in the developer portal, copy the Client ID to DISCORD_CLIENT_ID and generate a secret to place in DISCORD_CLIENT_SECRET. Also, set the following URLs under 'Redirects':

- http://localhost:3000/api/auth/callback/discord
- http://domain:3000/api/auth/callback/discord

Make sure to change 'domain' in http://domain:3000/api/auth/callback/discord to your domain or public ip.

#### Spotify and Twitch

Create an application in each platform's developer portal and paste the relevant values.

# Running the bot

1. If you followed everything right, hit `npm i` in the root folder. When it finishes make sure prisma didn't error.
2. Wait a few seconds and hit `npm run dev`.
3. If everything works, your bot and dashboard should be running.
4. Enjoy!

## Resources

[Getting a Tenor API key](https://developers.google.com/tenor/guides/quickstart)

[Getting a NewsAPI API key](https://newsapi.org/)

[Getting a Genius API key](https://genius.com/api-clients/new)

[Getting a rawg API key](https://rawg.io/apidocs)

[Getting a Twitch API key](https://github.com/Bacon-Fixation/Master-Bot/wiki/Getting-Your-Twitch-API-Info)

[Installing Node.js on Debian](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-debian-9)

[Installing Node.js on Windows](https://treehouse.github.io/installation-guides/windows/node-windows.html)

[Installing on a Raspberry Pi](https://github.com/galnir/Master-Bot/wiki/Running-the-bot-on-a-Raspberry-Pi)

[Using a Repl.it LavaLink server](https://github.com/galnir/Master-Bot/wiki/Setting-Up-LavaLink-with-a-Replit-server)

[Using a public LavaLink server](https://github.com/galnir/Master-Bot/wiki/Setting-Up-LavaLink-with-a-public-LavaLink-Server)

[Using an Internal LavaLink server](https://github.com/galnir/Master-Bot/wiki/Setting-up-LavaLink-with-an-Internal-LavaLink-server)

## Contributing

Fork it and submit a pull request!
Anyone is welcome to suggest new features and improve code quality!