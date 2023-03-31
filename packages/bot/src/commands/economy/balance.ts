import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import { CommandInteraction, GuildMember, Message, MessageEmbed } from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "balance",
  aliases: ["bal"],
  description: "Check your balance.",
  preconditions: [
    'inBotChannel'
  ]
})
export class BalanceCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    try {
      let user = await trpcNode.user.getUserById.query({
        id: interaction.user.id,
      });

      const embed = new MessageEmbed()
        .setAuthor(
          `${interaction.user.username}#${interaction.user.discriminator}`,
          interaction.user.displayAvatarURL({ dynamic: true })
        )
        .setDescription(
          `You currently have ${process.env.COIN_EMOJI}${String(
            user!.user!.cash
          )}.`
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
      let user = await trpcNode.user.getUserById.query({
        id: message.author.id,
      });

      const embed = new MessageEmbed()
        .setAuthor(
          `${message.author.username}#${message.author.discriminator}`,
          message.author.displayAvatarURL({ dynamic: true })
        )
        .setDescription(
          `You currently have ${process.env.COIN_EMOJI}${String(
            user!.user!.cash
          )}.`
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
