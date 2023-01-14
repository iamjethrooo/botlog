import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions
} from '@sapphire/framework';
import { CommandInteraction, MessageEmbed, Message } from 'discord.js';
import axios from 'axios';

@ApplyOptions<CommandOptions>({
  name: 'chucknorris',
  description: 'Get a satirical fact about Chuck Norris!'
})
export class ChuckNorrisCommand extends Command {
  public override chatInputRun(interaction: CommandInteraction) {
    axios
      .get('https://api.chucknorris.io/jokes/random')
      .then(async response => {
        const embed = new MessageEmbed()
          .setColor('#CD7232')
          .setAuthor({
            name: 'Chuck Norris',
          })
          .setDescription(response.data.value)
          .setTimestamp();
        return interaction.reply({ embeds: [embed] });
      })
      .catch(async error => {
        console.error(error);
        return await interaction.reply(
          ':x: An error occured, Chuck is investigating this!'
        );
      });
  }

  public override async messageRun(message: Message) {
    axios
      .get('https://api.chucknorris.io/jokes/random')
      .then(async response => {
        const embed = new MessageEmbed()
          .setColor('#CD7232')
          .setAuthor({
            name: 'Chuck Norris',
          })
          .setDescription(response.data.value)
          .setTimestamp();
        return message.reply({ embeds: [embed] });
      })
      .catch(async error => {
        console.error(error);
        return await message.reply(
          ':x: An error occured, Chuck is investigating this!'
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
