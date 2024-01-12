import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import {
  CommandInteraction,
  GuildMember,
  Message,
  EmbedBuilder,
} from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "bank",
  description: "Check the server's balance.",
  preconditions: ["inBotChannel"],
})
export class BankCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    try {
      let guild = await trpcNode.guild.getGuild.query({
        id: interaction!.guildId!,
      });

      const coinEmoji = await trpcNode.setting.getByKey.mutate({
        key: "coinEmoji",
      });

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${interaction.user.username}#${interaction.user.discriminator}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setDescription(
          `There is currently ${coinEmoji}${String(
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
      
      const coinEmoji = await trpcNode.setting.getByKey.mutate({
        key: "coinEmoji",
      });

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${message.author.username}#${message.author.discriminator}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setDescription(
          `There is currently ${coinEmoji}${String(
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
