import { SapphireClient } from '@sapphire/framework';
import { Intents, Message } from 'discord.js';
require('dotenv').config();

export class ExtendedClient extends SapphireClient {
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
  }
}

declare module '@sapphire/framework' {
  interface SapphireClient {
    snipes: Map<string, Message[]>;
    editsnipes: Map<string, Message>;
  }
}
