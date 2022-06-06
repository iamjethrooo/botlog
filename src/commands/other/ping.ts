import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions
} from '@sapphire/framework';
import type { CommandInteraction, Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  name: 'ping',
  description: 'Replies with Pong!'
})
export class PingCommand extends Command {
  public async chatInputRun(interaction: CommandInteraction) {
    const ping = Date.now() - interaction.createdTimestamp;
    const apiPing = Math.round(interaction.client.ws.ping);
    return await interaction.reply(
      `Pong! - Bot Latency: ${ping}ms - API Latency: ${apiPing}ms - Round Trip: ${
        ping + apiPing
      }ms`
    );
  }

  public async messageRun(message: Message) {
    const ping = Date.now() - message.createdTimestamp;
    const apiPing = Math.round(message.client.ws.ping);
    return await message.reply(
      `Pong! - Bot Latency: ${ping}ms - API Latency: ${apiPing}ms - Round Trip: ${
        ping + apiPing
      }ms`
    );
  }

  public override registerApplicationCommands(
    registery: ApplicationCommandRegistry
  ): void {
    registery.registerChatInputCommand({
      name: this.name,
      description: this.description
    });
  }
}
