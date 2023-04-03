import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions
} from '@sapphire/framework';
import { ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

@ApplyOptions<CommandOptions>({
  name: 'avatar',
  description: `Responds with a user's avatar`,
  preconditions: ['GuildOnly']
})
export class AvatarCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', true);
    const embed = new EmbedBuilder()
      .setTitle(user.username)
      .setImage(user.displayAvatarURL())
      .setColor('#0x00ae86');

    return await interaction.reply({ embeds: [embed] });
  }

  public override registerApplicationCommands(
    registery: ApplicationCommandRegistry
  ): void {
    registery.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          type: ApplicationCommandOptionType.User,
          required: true,
          name: 'user',
          description: `Which user's avatar do you want to look at?`
        }
      ]
    });
  }
}
