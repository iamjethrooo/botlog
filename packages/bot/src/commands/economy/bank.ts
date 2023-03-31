import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import { CommandInteraction, GuildMember, Message, MessageEmbed } from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "bank",
  description: "Check the server's balance.",
  preconditions: [
    'inBotChannel'
  ]
})
export class BankCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    try {
      let guild = await trpcNode.guild.getGuild.query({
        id: interaction!.guildId!,
      });

      const embed = new MessageEmbed()
        .setAuthor(
          `${interaction.user.username}#${interaction.user.discriminator}`,
          interaction.user.displayAvatarURL({ dynamic: true })
        )
        .setDescription(
          `There is currently ${process.env.COIN_EMOJI}${String(
            guild!.guild!.bank
          )} in the bank.`
        )
        .setTimestamp(interaction.createdAt)
        .setColor((<GuildMember>interaction.member)!.displayHexColor);
      return await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.log(error);
      return;
    }
  }

  public override async messageRun(message: Message) {
    try {
      let guild = await trpcNode.guild.getGuild.query({
        id: message!.guildId!,
      });

      const embed = new MessageEmbed()
        .setAuthor(
          `${message.author.username}#${message.author.discriminator}`,
          message.author.displayAvatarURL({ dynamic: true })
        )
        .setDescription(
          `There is currently ${process.env.COIN_EMOJI}${String(
            guild!.guild!.bank
          )} in the bank.`
        )
        .setTimestamp(message.createdAt)
        .setColor(message.member!.displayHexColor);
      return await message.reply({ embeds: [embed] });
    } catch (error) {
      console.log(error);
      return;
    }
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
