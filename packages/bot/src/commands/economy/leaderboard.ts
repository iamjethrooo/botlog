import { ApplyOptions } from "@sapphire/decorators";
import { PaginatedFieldMessageEmbed } from "@sapphire/discord.js-utilities";
import {
  ApplicationCommandRegistry,
  Args,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "leaderboard",
  aliases: ["lb"],
  description: "View the leaderboard.",
  preconditions: ["inBotChannel"],
})
export class LeaderboardCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    let leaderboard = await trpcNode.user.getLeaderboard.query();
    let leaderboardFormatted: String[] = [];
    let rank = 0;
    let index = 1;

    await interaction.guild!.members.fetch();

    leaderboard.leaderboard.forEach((user) => {
      let member = interaction.guild!.members.cache.get(user!.discordId!);
      let isMod = member ? member!.permissions.has("Administrator") : false;

      if (isMod) {
        return;
      }

      if (interaction.user.id == user.discordId) {
        rank = index;
      }
      leaderboardFormatted.push(
        `**${index}.** <@${user.discordId}> ・ ${process.env.COIN_EMOJI}${user.cash}`
      );
      index++;
    });
    const baseEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setAuthor({
        name: interaction!.guild!.name,
        iconURL: interaction!.guild!.iconURL()!,
      })
      .setFooter({
        text: `Your leaderboard rank: ${rank == 0 ? "N/A" : rank}`,
      });
    new PaginatedFieldMessageEmbed()
      .setTitleField("Leaderboard")
      .setTemplate(baseEmbed)
      .setItems(leaderboardFormatted)
      .setItemsPerPage(10)
      .make()
      .run(interaction);
  }

  public override async messageRun(message: Message, args: Args) {
    let showAll = (await args.pick("string").catch(() => 0)) == "all";
    let leaderboard = await trpcNode.user.getLeaderboard.query();
    let leaderboardFormatted: String[] = [];
    let rank = 0;
    let index = 1;

    await message.guild!.members.fetch();

    leaderboard.leaderboard.forEach((user) => {
      let member = message.guild!.members.cache.get(user!.discordId!);
      let isMod = member ? member!.permissions.has("Administrator") : false;

      if (isMod && !showAll) {
        return;
      }

      if (message.author.id == user.discordId) {
        rank = index;
      }
      leaderboardFormatted.push(
        `**${index}.** <@${user.discordId}> ・ ${process.env.COIN_EMOJI}${user.cash}`
      );
      index++;
    });
    const baseEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setAuthor({
        name: message!.guild!.name,
        iconURL: message!.guild!.iconURL()!,
      })
      .setFooter({
        text: `Your leaderboard rank: ${rank == 0 ? "N/A" : rank}`,
      });
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
