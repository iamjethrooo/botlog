import {
  ApplicationCommandRegistries,
  RegisterBehavior
} from '@sapphire/framework';
import type { NewsChannel, TextChannel, ThreadChannel } from 'discord.js';
import { ExtendedClient } from './structures/ExtendedClient';
require('dotenv').config();

const client = new ExtendedClient();

client.on('ready', async () => {
  client.user ?.setStatus('online');
});


export type MessageChannel = TextChannel | ThreadChannel | NewsChannel | null;

ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(
  RegisterBehavior.Overwrite
);

client.login(process.env.DISCORD_TOKEN);
