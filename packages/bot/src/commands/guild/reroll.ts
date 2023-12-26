import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Args,
  Command,
  CommandOptions,
  container,
} from "@sapphire/framework";
import {
  GuildMember,
  EmbedBuilder,
  ChatInputCommandInteraction,
  //ApplicationCommandOptionType,
  TextChannel,
  Message,
  ApplicationCommandOptionType,
} from "discord.js";
import { trpcNode } from "../../trpc";

export const participants: Map<string, GuildMember> = new Map();
@ApplyOptions<CommandOptions>({
  name: "reroll",
  description: "Reroll the winners of a giveaway",
  // preconditions: ["isCommandDisabled"],
})
export class RerollCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const { client } = container;
    const giveawayId = interaction.options.getString("message-id", true);

    const giveawayChannel = <TextChannel>(
      client.channels.cache.get(String(process.env.GIVEAWAY_CHANNEL_ID))
    );

    return interaction.reply({
      embeds: [await reroll(giveawayId, giveawayChannel)],
    });
  }

  public override async messageRun(message: Message, args: Args) {
    const { client } = container;
    const giveawayId = await args.pick("string").catch(() => "");

    const giveawayChannel = <TextChannel>(
      client.channels.cache.get(String(process.env.GIVEAWAY_CHANNEL_ID))
    );

    let winnerEmbed = await reroll(giveawayId, giveawayChannel);

    return giveawayChannel.send({
      // content: winnerString,
      embeds: [winnerEmbed],
    });
  }

  public override registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): void {
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          type: ApplicationCommandOptionType.String,
          required: true,
          name: "message-id",
          description: "What is the message ID of the giveaway?",
        },
      ],
    });
  }
}

function shuffle(array: String[]) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

async function reroll(giveawayId: string, giveawayChannel: TextChannel) {
  const giveaway = await trpcNode.giveaway.getById.mutate({
    giveawayId: giveawayId.toString(),
  });
  // Get participants
  const entries = await trpcNode.giveaway.getEntries.mutate({
    giveawayId: giveawayId.toString(),
  });

  let entriesFiltered = entries.map((entry) => {
    return entry.userId;
  });
  shuffle(entriesFiltered);
  // Pick winner
  let winners: String[] = [];
  for (let i = 0; i < giveaway!.numOfWinners; i++) {
    let random = Math.floor(Math.random() * entriesFiltered.length);
    let winnerId = entriesFiltered[random];
    winners.push(winnerId);
    entriesFiltered.filter((entry) => {
      return entry != winnerId;
    });
  }
  let winnerString = "";
  winners.forEach((winner) => {
    winnerString += `<@${winner}> `;
  });
  winnerString.trimEnd();
  // Announce winner

  let message = await giveawayChannel.messages.fetch(giveaway!.messageId);
  let messageEmbed = message.embeds[0];
  let newEmbed = new EmbedBuilder()
    .setTitle(messageEmbed.title)
    .setColor(messageEmbed.color)
    .setDescription(
      `Winner${giveaway!.numOfWinners > 1 ? "s" : ""}: ${winnerString}
      
      Hosted by: <@${giveaway?.hostId}>`
    )
    .setFooter({ text: "Ended: " })
    .setTimestamp();
  message.edit({
    content: "🎉Giveaway Ended🎉",
    embeds: [newEmbed],
  });
  winnerString.trimEnd();
  winnerString =
    `The new winner${
      giveaway!.numOfWinners > 1 ? "s" : ""
    } of the giveaway [**${giveaway!.prize}**](${await message.url}) ${
      giveaway!.numOfWinners > 1 ? "are" : "is"
    }: ` +
    winnerString +
    ". Congratulations! 🎉";
  const winnerEmbed = new EmbedBuilder()
    .setColor("#546e7a")
    .setDescription(`${winnerString}`);

  return winnerEmbed;
}
