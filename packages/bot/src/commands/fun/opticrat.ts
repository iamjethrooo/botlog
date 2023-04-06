import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions
} from '@sapphire/framework';
import { CommandInteraction, Message, EmbedBuilder } from 'discord.js';

@ApplyOptions<CommandOptions>({
  name: 'optic-rat',
  aliases: ['opticrat'],
  description: 'THE FIBR OPTIC RAT'
})
export class OpticRatCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
  }

  public override async messageRun(message: Message) {
    const embed = new EmbedBuilder()
    .setTitle("THE FIBR OPTIC RAT")
    .setDescription("one day in La Trinidad there is a rat that ate all the fiber optic wirings in someone's house, The rat eventually spread it's virus in the whole valley of La Trinidad Benguet, Currently the admin of the server is infected with this non curable disease the can spread over the internet DO NOT IN ANY SHAPE OR FORM TALK TO RICE because the virus from the FIBR OPTIC RAT can travel through the dimensions and can get you infected in voice chats, BE CAREFUL, BE WARNED.\n- your mom 2023")
    .setImage("https://cdn.discordapp.com/attachments/682838969179832423/1071441316355002449/artworks-000600280194-ie0mm2-t500x500.png")
    .setColor("#F5463D")
    .setURL("https://discord.com/channels/669190303353143306/682838969179832423/1071441316669558865")

    return await message.channel.send({ embeds: [embed] });
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
