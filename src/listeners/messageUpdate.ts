import { ApplyOptions } from '@sapphire/decorators';
import {
  Listener,
  ListenerOptions,
  container
} from '@sapphire/framework';
import type { Message } from 'discord.js';

@ApplyOptions<ListenerOptions>({
  event: 'messageUpdate'
})
export class MessageUpdateListener extends Listener {
  public override async run(message: Message): Promise<void> {
    if (message.author.bot) return;
    const { client } = container;
    client.editsnipes.set(message.channel.id, message);
  }
}
