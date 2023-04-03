import { load } from '@lavaclient/spotify';
import {
  ApplicationCommandRegistries,
  RegisterBehavior
} from '@sapphire/framework';
import type { NewsChannel, TextChannel, ThreadChannel } from 'discord.js';
import buttonsCollector from './lib/utils/music/buttonsCollector';
import { ExtendedClient } from './structures/ExtendedClient';
import Logger from './lib/utils/logger';
import { ErrorListeners } from './listeners/ErrorHandling';
import ReminderEvents from './lib/utils/reminders/ReminderEvents';
import { checkReminders } from './lib/utils/reminders/handleReminders';
import { Time } from '@sapphire/time-utilities';

if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
  load({
    client: {
      id: process.env.SPOTIFY_CLIENT_ID,
      secret: process.env.SPOTIFY_CLIENT_SECRET
    },
    autoResolveYoutubeTracks: true
  });
}

const client = new ExtendedClient();

ErrorListeners();

client.on('ready', async () => {
  client.music.connect(client.user!.id);
  client.user ?.setStatus('online');

  try {
    ReminderEvents();
    await checkReminders();

    // maintenance
    setInterval(async () => {
      await checkReminders();
    }, Time.Day);
  } catch (error) {
    Logger.error('Reminders Start ' + error);
  }

  client.guilds.cache.map(async guild => {
    const queue = client.music.queues.get(guild.id);

    // grab last known voice state of bot
    const voiceState = await guild.voiceStates.cache.find(
      user => user.id == client.application?.id
    );

    // update lavalink manually if the bot is still in voice chat after restart
    const customVoiceStateUpdate = {
      session_id: voiceState?.sessionId,
      channel_id: voiceState?.channel?.id,
      guild_id: voiceState?.guild.id,
      user_id: guild.members.me?.id
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

declare module 'lavaclient' {
  interface Player {
    nightcore: boolean;
    vaporwave: boolean;
    karaoke: boolean;
    bassboost: boolean;
  }
}

ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(
  RegisterBehavior.Overwrite
);

client.login(process.env.DISCORD_TOKEN);
