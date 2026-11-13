import { load } from "@lavaclient/spotify";
import {
  ApplicationCommandRegistries,
  RegisterBehavior,
} from "@sapphire/framework";
import type {
  NewsChannel,
  TextChannel,
  ThreadChannel,
} from "discord.js";
import buttonsCollector from "./lib/utils/music/buttonsCollector";
import { ExtendedClient } from "./structures/ExtendedClient";
import Logger from "./lib/utils/logger";
import { ErrorListeners } from "./listeners/ErrorHandling";
import * as fs from 'fs';
import { beginShutdown, drainWork } from './lib/lifecycle';
import { once } from 'events';
import { tmpdir } from 'os';
import path from 'path';

if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
  load({
    client: {
      id: process.env.SPOTIFY_CLIENT_ID,
      secret: process.env.SPOTIFY_CLIENT_SECRET,
    },
    autoResolveYoutubeTracks: true,
  });
}

const client = new ExtendedClient();

ErrorListeners();

client.on("ready", async () => {
  client.music.connect(client.user!.id);
  client.user?.setStatus("online");

  client.guilds.cache.map(async (guild) => {
    const queue = client.music.queues.get(guild.id);

    // grab last known voice state of bot
    const voiceState = await guild.voiceStates.cache.find(
      (user) => user.id == client.application?.id
    );

    // update lavalink manually if the bot is still in voice chat after restart
    const customVoiceStateUpdate = {
      session_id: voiceState?.sessionId,
      channel_id: voiceState?.channel?.id,
      guild_id: voiceState?.guild.id,
      user_id: guild.members.me?.id,
    };
    if (queue) {
      if (guild.members.me?.voice) {
        if (!customVoiceStateUpdate.channel_id) return;
        queue.createPlayer();
        queue.connect(customVoiceStateUpdate.channel_id);
        await queue.start();

        const song = await queue.getCurrentTrack();
        if (song) {
          const channel = guild.channels.cache.get(
            (await queue.getTextChannelID()) as string
          );
          // remake the message collector so buttons will work again after restart
          if (channel?.isTextBased()) {
            const message = await channel.messages.fetch(
              (await queue.getEmbed()) as string
            );

            if (queue.player) {
              try {
                await buttonsCollector(message, song);
              } catch (e) {
                Logger.error(e);
              }
            }
          }
        }
      }
    }
  });
});

export type MessageChannel = TextChannel | ThreadChannel | NewsChannel | null;

declare module "lavaclient" {
  interface Player {
    nightcore: boolean;
    vaporwave: boolean;
    karaoke: boolean;
    bassboost: boolean;
  }
}

if (!process.env.GUILD_ID) throw new Error('GUILD_ID is required');
ApplicationCommandRegistries.setDefaultGuildIds([process.env.GUILD_ID]);
ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(
  RegisterBehavior.Overwrite
);

// Runtime Redis reconnection is automatic, but initial login must wait for it.
const heartbeatFile = path.join(tmpdir(), 'botlog-ready');
try { fs.unlinkSync(heartbeatFile); } catch { /* No previous readiness marker. */ }
const startupDeadline = setTimeout(() => {
  if (!client.startupReady) {
    console.error('Bot initialization timed out');
    void shutdown(1);
  }
}, 120000);
startupDeadline.unref();
const heartbeat = setInterval(() => {
  if (client.isReady() && client.startupReady && client.music.queues.redis.status === 'ready') {
    fs.writeFileSync(heartbeatFile, String(Date.now()));
  }
}, 5000);
heartbeat.unref();

let stopping = false;
async function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  clearInterval(heartbeat);
  clearTimeout(startupDeadline);
  try { fs.unlinkSync(heartbeatFile); } catch { /* Not yet ready. */ }
  const deadline = setTimeout(() => process.exit(1), 25000);
  deadline.unref();
  beginShutdown();
  client.removeAllListeners();
  client.ws.removeAllListeners();
  const drained = await drainWork();
  client.music.conn.disconnect();
  client.music.removeAllListeners();
  await client.destroy();
  const redisDeadline = setTimeout(() => client.music.queues.redis.disconnect(), 2000);
  try { await client.music.queues.redis.quit(); }
  catch { /* An offline Redis connection cannot acknowledge QUIT. */ }
  finally { clearTimeout(redisDeadline); client.music.queues.redis.disconnect(); }
  // Process exit also releases third-party internal timers and connection pools.
  // Never clear Redis music keys or rewrite topic state during shutdown.
  process.exit(drained ? code : 1);
}
process.once('SIGTERM', () => void shutdown());
process.once('SIGINT', () => void shutdown());

async function start() {
  const redis = client.music.queues.redis;
  if (redis.status !== 'ready') await once(redis, 'ready');
  await client.login(process.env.DISCORD_TOKEN);
}
void start().catch(() => {
  console.error('Bot startup failed');
  void shutdown(1);
});
