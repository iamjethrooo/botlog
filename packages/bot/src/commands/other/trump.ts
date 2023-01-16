import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions
} from '@sapphire/framework';
import { CommandInteraction, MessageEmbed, Message } from 'discord.js';
import axios from 'axios';

@ApplyOptions<CommandOptions>({
  name: 'trump',
  description: 'Replies with a random Trump quote'
})
export class TrumpCommand extends Command {
  public override chatInputRun(interaction: CommandInteraction) {
    axios
      .get('https://api.tronalddump.io/random/quote')
      .then(async response => {
        const quote: string = response.data.value;
        const embed = new MessageEmbed()
          .setColor('#BB7D61')
          .setAuthor({
            name: 'Donald Trump',
            url: 'https://api.tronalddump.io/random/quote',
            iconURL:
              'https://www.whitehouse.gov/wp-content/uploads/2021/01/45_donald_trump.jpg'
          })
          .setDescription(quote)
          .setTimestamp(response.data.appeared_at);
        return await interaction.reply({ embeds: [embed] });
      })
      .catch(async error => {
        console.error(error);
        return await interaction.reply(
          'Something went wrong when fetching a Trump quote :('
        );
      });
  }

  public override async messageRun(message: Message) {
    axios
      .get('https://api.tronalddump.io/random/quote')
      .then(async response => {
        const quote: string = response.data.value;
        const embed = new MessageEmbed()
          .setColor('#BB7D61')
          .setAuthor({
            name: 'Donald Trump',
            url: 'https://api.tronalddump.io/random/quote',
            iconURL:
              'https://www.whitehouse.gov/wp-content/uploads/2021/01/45_donald_trump.jpg'
          })
          .setDescription(quote)
          .setTimestamp(response.data.appeared_at);
        return await message.reply({ embeds: [embed] });
      })
      .catch(async error => {
        console.error(error);
        return await message.reply(
          'Something went wrong when fetching a Trump quote :('
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