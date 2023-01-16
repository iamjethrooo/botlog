import { SapphireClient } from '@sapphire/framework';
import { Intents, Message } from 'discord.js';
import { QueueClient } from '../lib/utils/queue/QueueClient';
import Redis from 'ioredis';
import { deletePlayerEmbed } from '../lib/utils/music/buttonsCollector';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({
  path: path.resolve(__dirname, '../../../../.env')
});

export class ExtendedClient extends SapphireClient {
  readonly music: QueueClient;
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
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_VOICE_STATES
      ],
      logger: { level: 100 }
    });

    this.music = new QueueClient({
      sendGatewayPayload: (id, payload) =>
        this.guilds.cache.get(id)?.shard?.send(payload),
      options: {
        redis: new Redis({
          host: process.env.REDIS_HOST || '',
          port: Number.parseInt(process.env.REDIS_PORT!) || 6379,
          password: process.env.REDIS_PASSWORD || '',
          db: Number.parseInt(process.env.REDIS_DB!) || 0
        })
      },
      connection: {
        host: process.env.LAVA_HOST || '',
        password: process.env.LAVA_PASS || '',
        port: process.env.LAVA_PORT ? +process.env.LAVA_PORT : 1339,
        secure: process.env.LAVA_SECURE === 'true' ? true : false
      }
    });

    this.ws.on('VOICE_SERVER_UPDATE', data => {
      this.music.handleVoiceUpdate(data);
    });

    this.ws.on('VOICE_STATE_UPDATE', async data => {
      // handle if a mod right-clicks disconnect on the bot
      if (!data.channel_id && data.user_id == this.application?.id) {
        const queue = this.music.queues.get(data.guild_id);
        await deletePlayerEmbed(queue);
        await queue.clear();
        queue.destroyPlayer();
      }
      this.music.handleVoiceUpdate(data);
    });

    this.leaveTimers = {};

    this.snipes = new Map<string, Message[]>();
    this.editsnipes = new Map<string, Message>;
  }
}

declare module '@sapphire/framework' {
  interface SapphireClient {
    readonly music: QueueClient;
    leaveTimers: { [key: string]: NodeJS.Timer };
    snipes: Map<string, Message[]>;
    editsnipes: Map<string, Message>;
  }
}