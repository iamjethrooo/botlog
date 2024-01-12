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

async function generateLeaderboard(user: User, guild: Guild, showAll: boolean) {
  const coinEmoji = await trpcNode.setting.getByKey.mutate({
    key: "coinEmoji",
  });

  try {
    let allItems = await trpcNode.item.getAll.query();

    let fakeId = allItems.allItems.find(
      (i) => i.name.toLowerCase() == "fake id"
    );
    let leaderboard = await trpcNode.user.getLeaderboard.query();
    let leaderboardFormatted: String[] = [];
    let rank = 0;
    let index = 1;

    for (const _user of leaderboard.leaderboard) {
      let member = guild!.members.cache.get(_user!.discordId!);
      let isMod = member ? member!.permissions.has("Administrator") : false;
      isMod = false;

      if (!member || (isMod && !showAll)) {
        continue;
      }

      let userInventory = await trpcNode.inventory.getByUserId.mutate({
        userId: _user.discordId,
      });

      let userHasFakeId = userInventory.inventory.some(
        (e) => e.itemId == fakeId!.id
      );

      if (user.id == _user.discordId) {
        rank = userHasFakeId ? 0 : index;
      }

      leaderboardFormatted.push(
        `**${index}.** ${
          userHasFakeId
            ? `**${generateRandomName()}**`
            : `<@${_user.discordId}>`
        } ・ ${coinEmoji}${_user.cash}`
      );
      index++;
    }
    return { rank: rank, array: leaderboardFormatted };
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
      interaction.guild!,
      false
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

  public override async messageRun(message: Message, args: Args) {
    let showAll = (await args.pick("string").catch(() => 0)) == "all";
    let leaderboard = await generateLeaderboard(
      message.author,
      message.guild!,
      showAll
    );

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
      .setItemsPerPage(20)
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
