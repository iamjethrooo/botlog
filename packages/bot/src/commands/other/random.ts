import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions
} from '@sapphire/framework';
import { ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

@ApplyOptions<CommandOptions>({
  name: 'random',
  description: 'Generate a random number between two inputs!'
})
export class RandomCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const min = Math.ceil(interaction.options.getInteger('min', true));
    const max = Math.floor(interaction.options.getInteger('max', true));

    const rngEmbed = new EmbedBuilder().setTitle(
      `${Math.floor(Math.random() * (max - min + 1)) + min}`
    );

    return await interaction.reply({ embeds: [rngEmbed] });
  }

  public override registerApplicationCommands(
    registery: ApplicationCommandRegistry
  ): void {
    registery.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          type: ApplicationCommandOptionType.Integer,
          required: true,
          name: 'min',
          description: 'What is the minimum number?'
        },
        {
          type: ApplicationCommandOptionType.Integer,
          required: true,
          name: 'max',
          description: 'What is the maximum number?'
        }
      ]
    });
  }
}
