import { SapphireClient } from '@sapphire/framework';
import { Intents, Message } from 'discord.js';
import { ChatGPTAPI } from 'chatgpt';
require('dotenv').config();

export class ExtendedClient extends SapphireClient {
  snipes: Map<string, Message[]>;
  editsnipes: Map<string, Message>;
  chatGPT: ChatGPTAPI;

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
    this.chatGPT = new ChatGPTAPI({
        sessionToken: `${process.env.SESSION_TOKEN}`
    });
  }
}

declare module '@sapphire/framework' {
  interface SapphireClient {
    snipes: Map<string, Message[]>;
    editsnipes: Map<string, Message>;
    chatGPT: ChatGPTAPI;
  }
}
