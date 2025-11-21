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
  name: "balance",
  aliases: ["bal"],
  description: "Check your balance.",
  preconditions: ["inBotChannel"],
})
export class BalanceCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    const coinEmoji = await trpcNode.setting.getByKey.mutate({
      key: "coinEmoji",
    });

    try {
      await interaction.deferReply();
      let user = await trpcNode.user.getUserById.query({
        id: interaction.user.id,
      });

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setDescription(
          `You currently have ${coinEmoji!}${String(user!.user!.cash)}.`
        )
        .setTimestamp(interaction.createdAt)
        .setColor((<GuildMember>interaction.member)!.displayHexColor);
      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.log(error);
      return;
    }
  }

  public override async messageRun(message: Message) {
    const coinEmoji = await trpcNode.setting.getByKey.mutate({
      key: "coinEmoji",
    });
    try {
      let user = await trpcNode.user.getUserById.query({
        id: message.author.id,
      });

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${message.author.username}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setDescription(
          `You currently have ${coinEmoji}${String(
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
