import { ApplyOptions } from "@sapphire/decorators";
import { PaginatedFieldMessageEmbed } from "@sapphire/discord.js-utilities";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "leaderboard",
  aliases: ["lb"],
  description: "Replies with Pong!",
})
export class LeaderboardCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message) {
    let leaderboard = await trpcNode.user.getLeaderboard.query();
    let leaderboardFormatted: String[] = [];
    let rank = 0;
    let index = 1;

    leaderboard.leaderboard.forEach((user) => {
      if (message.author.id == user.discordId) {
        rank = index;
      }
      leaderboardFormatted.push(
        `**${index}.** <@${user.discordId}> ・ ${process.env.COIN_EMOJI}${user.cash}`
      );
      index++;
    });
    const baseEmbed = new MessageEmbed()
      .setColor("#FF0000")
      .setAuthor({
        name: message!.guild!.name,
        iconURL: message!.guild!.iconURL()!,
      })
      .setFooter(`Your leaderboard rank: ${rank == 0 ? "N/A" : rank}`);
    new PaginatedFieldMessageEmbed()
      .setTitleField("Leaderboard")
      .setTemplate(baseEmbed)
      .setItems(leaderboardFormatted)
      .setItemsPerPage(10)
      .make()
      .run(message);
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
