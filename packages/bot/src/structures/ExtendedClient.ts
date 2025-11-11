import { SapphireClient } from "@sapphire/framework";
import {
  GatewayDispatchEvents,
  GatewayIntentBits,
  Partials,
  Message,
} from "discord.js";
import { QueueClient } from "../lib/utils/queue/QueueClient";
import Redis from "ioredis";
import { deletePlayerEmbed } from "../lib/utils/music/buttonsCollector";
import path from "path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(__dirname, "../../../../.env"),
});

export class ExtendedClient extends SapphireClient {
  readonly music: QueueClient;
  leaveTimers: { [key: string]: NodeJS.Timeout };
  snipes: Map<string, Message[]>;
  editsnipes: Map<string, Message>;
  intervals: { [key: string]: NodeJS.Timeout };
  timestamps: { [key: string]: string };
  heistMembers: String[];
  heistLeader: String;
  heistIsOngoing: boolean;
  rrPlayers: [];
  rrBet: Number;
  rrIsOngoing: boolean;
  activeGiveaways: String[];

  public constructor() {
    super({
      defaultPrefix: process.env.PREFIX,
      caseInsensitivePrefixes: true,
      caseInsensitiveCommands: true,
      loadMessageCommandListeners: true,
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
      ],
      partials: [Partials.Message, Partials.Reaction],
      logger: { level: 100 },
    });

    this.music = new QueueClient({
      sendGatewayPayload: (id, payload) =>
        this.guilds.cache.get(id)?.shard?.send(payload),
      options: {
        redis: new Redis({
          host: process.env.REDIS_HOST || "",
          port: Number.parseInt(process.env.REDIS_PORT!) || 6379,
          password: process.env.REDIS_PASSWORD || "",
          db: Number.parseInt(process.env.REDIS_DB!) || 0,
        }),
      },
      connection: {
        host: process.env.LAVA_HOST || "",
        password: process.env.LAVA_PASS || "",
        port: process.env.LAVA_PORT ? +process.env.LAVA_PORT : 1339,
        secure: process.env.LAVA_SECURE === "true" ? true : false,
      },
    });

    this.ws.on(GatewayDispatchEvents.VoiceServerUpdate, (data) => {
      this.music.handleVoiceUpdate(data);
    });

    this.ws.on(GatewayDispatchEvents.VoiceStateUpdate, async (data) => {
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
    this.editsnipes = new Map<string, Message>();

    this.intervals = {};
    this.heistMembers = [];
    this.heistLeader = "";
    this.timestamps = {};
    this.heistIsOngoing = false;
    this.rrPlayers = [];
    this.rrBet = 0;
    this.rrIsOngoing = false;
    this.activeGiveaways = [];
  }
}

declare module "@sapphire/framework" {
  interface SapphireClient {
    readonly music: QueueClient;
    leaveTimers: { [key: string]: NodeJS.Timeout };
    snipes: Map<string, Message[]>;
    editsnipes: Map<string, Message>;
    heistMembers: String[];
    heistLeader: String;
    intervals: { [key: string]: NodeJS.Timeout };
    timestamps: { [key: string]: string };
    heistIsOngoing: boolean;
    rrPlayers: String[];
    rrBet: Number;
    rrIsOngoing: boolean;
    activeGiveaways: String[];
  }
}
