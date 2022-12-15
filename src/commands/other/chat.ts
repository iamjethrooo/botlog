import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
  container
} from '@sapphire/framework';
import { CommandInteraction, MessageEmbed, Message } from 'discord.js';
require('dotenv').config();
@ApplyOptions<CommandOptions>({
  name: '',
  description: ''
})
export class ChatCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    const { client } = container;
    const chatGPT = client.chatGPT;

    await chatGPT.ensureAuth();
    const prompt = interaction.options.getString('prompt', true);
    const response = await chatGPT.sendMessage(prompt);

    const answerEmbed = new MessageEmbed()
    .setTitle(prompt)
    .setAuthor({
      name: 'Test',
      // iconURL: 'https://i.imgur.com/HbwMhWM.png'
    })
    .setDescription(response)
    .setColor('#000000')
    .setTimestamp();
  return await interaction.reply({ embeds: [answerEmbed] });
  }

  public override async messageRun(message: Message) {
    
  }

  public override registerApplicationCommands(
    registery: ApplicationCommandRegistry
  ): void {
    registery.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          type: 'STRING',
          required: true,
          name: 'prompt',
          description: 'Give a prompt.'
        }
      ]
    });
  }
}
