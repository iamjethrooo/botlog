import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions
} from '@sapphire/framework';
import type { CommandInteraction, Message } from 'discord.js';
import axios from 'axios';

@ApplyOptions<CommandOptions>({
  name: 'advice',
  description: 'Get some advice!'
})
export class AdviceCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    await interaction.deferReply();
    axios
      .get('https://api.adviceslip.com/advice')
      .then(async response => {
        const advice: string = response.data.slip.advice;

        return await interaction.editReply(advice);
      })
      .catch(async error => {
        console.error(error);
        return await interaction.editReply(
          'Something went wrong when asking for advice :('
        );
      });
  }

  public override async messageRun(message: Message) {
    axios
      .get('https://api.adviceslip.com/advice')
      .then(async response => {
        const advice: string = response.data.slip.advice;
        return await message.reply(advice);
      })
      .catch(async error => {
        console.error(error);
        return await message.reply(
          'Something went wrong when asking for advice :('
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
