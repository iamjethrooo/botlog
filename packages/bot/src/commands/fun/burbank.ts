import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";

@ApplyOptions<CommandOptions>({
  name: "burbank",
  description: "Check out Burbank's Ungodly Concoction.",
})
export class BurbankCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    await interaction.deferReply();
    const embed = new EmbedBuilder()
      .setTitle("The Burbank")
      .setColor("#893cbc")
      .setThumbnail(
        "https://cdn.discordapp.com/attachments/734048924519759982/734070202118963290/JPEG_20200718_233247.jpg"
      )
      .setDescription(
        "1 shot Gin\n1 teaspoon Hot Sauce\n1 teaspoon Whole Pepper Corn\n1 teaspoon Bear Brand\n1 teaspoon Curry Powder"
      )
      .setURL(
        "https://discordapp.com/channels/669190303353143306/734048924519759982/734070202500776036"
      )
      .setFooter({ text: "Burbank's Ungodly Concoction" });
    return await interaction.editReply({ embeds: [embed] });
  }

  public override async messageRun(message: Message) {
    const embed = new EmbedBuilder()
      .setTitle("The Burbank")
      .setColor("#893cbc")
      .setThumbnail(
        "https://cdn.discordapp.com/attachments/734048924519759982/734070202118963290/JPEG_20200718_233247.jpg"
      )
      .setDescription(
        "1 shot Gin\n1 teaspoon Hot Sauce\n1 teaspoon Whole Pepper Corn\n1 teaspoon Bear Brand\n1 teaspoon Curry Powder"
      )
      .setURL(
        "https://discordapp.com/channels/669190303353143306/734048924519759982/734070202500776036"
      )
      .setFooter({ text: "Burbank's Ungodly Concoction" });
    return await message.reply({ embeds: [embed] });
  }

  public override registerApplicationCommands(
    registery: ApplicationCommandRegistry
  ): void {
    registery.registerChatInputCommand({
      name: this.name,
      description: this.description,
    });
  }
}
