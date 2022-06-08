import { SapphireClient } from '@sapphire/framework';
import { Intents, Message } from 'discord.js';
import { Node } from 'lavaclient';
import { embedButtons } from '../lib/utils/music/ButtonHandler';
import { NowPlayingEmbed } from './../lib/utils/music/NowPlayingEmbed';
import { manageStageChannel } from './../lib/utils/music/channelHandler';
import { inactivityTime } from '../lib/utils/music/handleOptions';
require('dotenv').config();

export class ExtendedClient extends SapphireClient {
  readonly music: Node;
  playerEmbeds: { [key: string]: string };
  leaveTimers: { [key: string]: NodeJS.Timer };
  snipes: Map<string, Message[]>;
  editsnipes: Map<string, Message>;

  public constructor() {
    super({
      defaultPrefix: process.env.PREFIX,
      loadMessageCommandListeners: true,
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES
      ]
    });

    this.snipes = new Map<string, Message[]>();
    this.editsnipes = new Map<string, Message>;

    this.music = new Node({
      sendGatewayPayload: (id, payload) =>
        this.guilds.cache.get(id) ?.shard ?.send(payload),
      connection: {
        host: process.env.LAVA_HOST!,
        password: process.env.LAVA_PASS!,
        port: parseInt(process.env.LAVA_PORT!),
        secure: process.env.LAVA_SECURE! == 'true'
      }
    });

    // on VOICE_SERVER_UPDATE
    this.ws.on('VOICE_SERVER_UPDATE', data => {
      this.music.handleVoiceUpdate(data);
    });
    // on VOICE_STATE_UPDATE
    this.ws.on('VOICE_STATE_UPDATE', data => {
      this.music.handleVoiceUpdate(data);
    });

    this.playerEmbeds = {};
    this.leaveTimers = {};

    // on queueFinish
    this.music.on('queueFinish', queue => {
      queue.player.stop();

      this.leaveTimers[queue.player.guildId] = setTimeout(() => {
        queue.channel!.send(':zzz: Leaving due to inactivity');
        queue.player.disconnect();
        queue.player.node.destroyPlayer(queue.player.guildId);
      }, inactivityTime());
      delete this.playerEmbeds[queue.player.guildId];
    });

    // on trackStart
    this.music.on('trackStart', async (queue, song) => {
      if (this.leaveTimers[queue.player.guildId]) {
        clearTimeout(this.leaveTimers[queue.player.guildId]!);
      }

      const NowPlaying = new NowPlayingEmbed(
        song,
        0,
        queue.current!.length as number,
        queue.player.volume,
        queue.tracks!,
        queue.last!,
        false
      );

      await embedButtons(NowPlaying.NowPlayingEmbed(), queue, song);

      const voiceChannel = this.voice.client.channels.cache.get(
        queue.player.channelId!
      );

      // Stage Channels
      if (voiceChannel ?.type === 'GUILD_STAGE_VOICE') {
        const botUser = voiceChannel ?.members.get(this.application ?.id!);
        await manageStageChannel(voiceChannel, botUser!, queue);
      }
    });
  }
}

declare module '@sapphire/framework' {
  interface SapphireClient {
    readonly music: Node;
    playerEmbeds: { [key: string]: string };
    leaveTimers: { [key: string]: NodeJS.Timer };
    snipes: Map<string, Message[]>;
    editsnipes: Map<string, Message>;
  }
}
