import { ApplyOptions } from "@sapphire/decorators";
import { PaginatedFieldMessageEmbed } from "@sapphire/discord.js-utilities";
import {
  ApplicationCommandRegistry,
  Args,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import {
  ChatInputCommandInteraction,
  Message,
  EmbedBuilder,
  Guild,
  User,
} from "discord.js";
import { trpcNode } from "../../trpc";

function generateRandomName(): string {
  const adjectives: string[] = [
    "Anonymous",
    "Brave",
    "Clever",
    "Daring",
    "Eager",
    "Fierce",
    "Gentle",
    "Honest",
    "Intrepid",
    "Jolly",
    "Kind",
    "Loyal",
    "Mighty",
    "Nimble",
    "Optimistic",
    "Powerful",
    "Quick",
    "Resolute",
    "Steadfast",
    "True",
    "Valiant",
    "Wise",
    "Xenial",
    "Yielding",
    "Zealous",
  ];
  const nouns: string[] = [
    "Adventurer",
    "Bandit",
    "Champion",
    "Dragon",
    "Explorer",
    "Fighter",
    "Gladiator",
    "Hero",
    "Innovator",
    "Jester",
    "Knight",
    "Legend",
    "Maverick",
    "Ninja",
    "Outlaw",
    "Pirate",
    "Queen",
    "Ranger",
    "Samurai",
    "Traveler",
    "Unicorn",
    "Viking",
    "Warrior",
    "X-factor",
    "Yak",
    "Zookeeper",
  ];
  const adjectiveIndex = Math.floor(Math.random() * adjectives.length);
  const nounIndex = Math.floor(Math.random() * nouns.length);
  return `${adjectives[adjectiveIndex]} ${nouns[nounIndex]}`;
}

async function generateLeaderboard(user: User, guild: Guild) {
  const coinEmoji = await trpcNode.setting.getByKey.mutate({
    key: "coinEmoji",
  });

  try {
    const { leaderboard } = await trpcNode.user.getGuildLeaderboard.mutate({ memberIds: [...guild.members.cache.keys()] });
    const leaderboardFormatted: string[] = [];
    let rank = 0;
    let index = 1;

    for (const entry of leaderboard) {
      if (!guild.members.cache.has(entry.discordId)) {
        continue;
      }

      if (user.id === entry.discordId && !entry.hasFakeId) {
        rank = index;
      }

      leaderboardFormatted.push(
        `**${index}.** ${
          entry.hasFakeId
            ? `**${generateRandomName()}**`
            : `<@${entry.discordId}>`
        }・${coinEmoji}${entry.cash}`
      );
      index++;
    }
    return { rank, array: leaderboardFormatted };
  } catch (error) {
    console.log(error);
  }
  return { rank: 0, array: [] };
}

@ApplyOptions<CommandOptions>({
  name: "leaderboard",
  aliases: ["lb"],
  description: "View the leaderboard.",
  preconditions: ["inBotChannel"],
})
export class LeaderboardCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const leaderboard = await generateLeaderboard(
      interaction.user,
      interaction.guild!
    );

    const baseEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setAuthor({
        name: interaction!.guild!.name,
        iconURL: interaction!.guild!.iconURL()!,
      })
      .setFooter({
        text: `Your leaderboard rank: ${
          leaderboard.rank == 0 ? "N/A" : leaderboard.rank
        }`,
      });
    new PaginatedFieldMessageEmbed()
      .setTitleField("Leaderboard")
      .setTemplate(baseEmbed)
      .setItems(leaderboard.array)
      .setItemsPerPage(20)
      .make()
      .run(interaction);

    return;
  }

  public override async messageRun(message: Message, _args: Args) {
    try {
      const leaderboard = await generateLeaderboard(message.author, message.guild!);

      const baseEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setAuthor({
          name: message!.guild!.name,
          iconURL: message!.guild!.iconURL()!,
        })
        .setFooter({
          text: `Your leaderboard rank: ${
            leaderboard.rank == 0 ? "N/A" : leaderboard.rank
          }`,
        });
      new PaginatedFieldMessageEmbed()
        .setTitleField("Leaderboard")
        .setTemplate(baseEmbed)
        .setItems(leaderboard.array)
        .setItemsPerPage(15)
        .make()
        .run(message);
    } catch (e) {
      console.log(e);
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
