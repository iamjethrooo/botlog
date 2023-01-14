import { ApplyOptions } from '@sapphire/decorators';
import {
  Listener,
  ListenerOptions
} from '@sapphire/framework';
import type { Client } from 'discord.js';

@ApplyOptions<ListenerOptions>({
  once: true,
  event: 'ready'
})
export class ReadyListener extends Listener {
  public override run(client: Client) {
  const { username, id } = client.user!;
  console.log(`Successfully logged in as ${username} (${id})`);
  }
}
