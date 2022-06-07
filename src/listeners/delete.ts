import { ApplyOptions } from '@sapphire/decorators';
import {
  Listener,
  ListenerOptions,
  container
} from '@sapphire/framework';
import type { Message } from 'discord.js';

@ApplyOptions<ListenerOptions>({
  event: 'messageDelete'
})
export class DeleteListener extends Listener {
  public override async run(message: Message): Promise<void> {
    if (message.author.bot) return;
    const { client } = container;

    let snipes: Message[] = [];

    if (!client.snipes.get(message.channel.id)) {
      snipes.push(message);
    } else {
      snipes = client.snipes.get(message.channel.id)!;
      snipes.unshift(message);
    }
    snipes.length = Math.min(snipes.length, 3);
    client.snipes.set(message.channel.id, snipes);

  }
}
