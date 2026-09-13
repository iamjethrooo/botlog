import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
  Args
} from '@sapphire/framework';
import { Message, ChatInputCommandInteraction, ApplicationCommandOptionType } from 'discord.js';

@ApplyOptions<CommandOptions>({
  name: 'choose',
  description: 'Choose between multiple options!'
})
export class ChooseCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const options = interaction.options.getString('options', true);
    await interaction.deferReply();

    // Split by spaces
    const choices = options.split(/\s+/).filter(Boolean);

    if (choices.length < 2) {
      return await interaction.editReply('Please provide at least two choices!');
    }

    const randomChoice = choices[Math.floor(Math.random() * choices.length)];
    return await interaction.editReply(`\`${randomChoice}\``);
  }

  public override async messageRun(message: Message, args: Args) {
    const choices = await args.repeat('string');

    if (choices.length < 2) {
      return await message.reply('Please provide at least two choices!');
    }

    const randomChoice = choices[Math.floor(Math.random() * choices.length)];
    return await message.reply(`\`${randomChoice}\``);
  }

  public override registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): void {
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          type: ApplicationCommandOptionType.String,
          required: true,
          name: 'options',
          description: 'Space-separated list of choices (e.g. "yes no maybe")'
        }
      ]
    });
  }
}