import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions
} from '@sapphire/framework';
import type { CommandInteraction, Message } from 'discord.js';
import axios from 'axios';
require('dotenv').config();

@ApplyOptions<CommandOptions>({
  name: 'triggered',
  description: 'Replies with a random triggered gif!'
})
export class TriggeredCommand extends Command {
  public override chatInputRun(interaction: CommandInteraction) {
    axios
      .get(`https://api.tenor.com/v1/random?key=${process.env.TENOR_API!}&q=triggered&limit=1`)
      .then(async response => {
        return await interaction.reply({
          content: response.data.results[0].url
        });
      })
      .catch(async error => {
        console.error(error);
        return await interaction.reply(
          'Something went wrong when trying to fetch a triggered gif :('
        );
      });
  }

  public override async messageRun(message: Message) {
    axios
      .get(`https://api.tenor.com/v1/random?key=${process.env.TENOR_API!}&q=triggered&limit=1`)
      .then(async response => {
        return await message.reply({
          content: response.data.results[0].url
        });
      })
      .catch(async error => {
        console.error(error);
        return await message.reply(
          'Something went wrong when trying to fetch a triggered gif :('
        );
      });
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
