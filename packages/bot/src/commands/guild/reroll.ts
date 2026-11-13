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
  Message,
  ApplicationCommandOptionType,
} from "discord.js";
import { trpcNode } from "../../trpc";
import { giveawayChannel } from "../../lib/giveawayLocation";
import { drawWinners } from "../../lib/giveawayCompletion";

export const participants: Map<string, GuildMember> = new Map();
@ApplyOptions<CommandOptions>({
  name: "reroll",
  description: "Reroll the winners of a giveaway",
  // preconditions: ["isCommandDisabled"],
})
export class RerollCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const giveawayId = interaction.options.getString("message-id", true);
    await interaction.deferReply();
    try {
      const { embed } = await reroll(giveawayId, interaction.guildId!);
      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Giveaway reroll failed", error);
      return interaction.editReply("Could not reroll this giveaway. Check the ID and original channel.");
    }
  }

  public override async messageRun(message: Message, args: Args) {
    const giveawayId = await args.pick("string").catch(() => "");
    try {
      const { channel, embed } = await reroll(giveawayId, message.guildId!);
      return channel.send({ embeds: [embed] });
    } catch (error) {
      console.error("Giveaway reroll failed", error);
      return message.reply("Could not reroll this giveaway. Check the ID and original channel.");
    }
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

async function reroll(giveawayId: string, guildId: string) {
  const giveaway = await trpcNode.giveaway.getById.mutate({
    giveawayId: giveawayId.toString(),
  });
  if (!giveaway?.ended) throw new Error("A completed giveaway is required.");
  const channel = await giveawayChannel(container.client, giveaway, guildId);
  // Get participants
  const entries = await trpcNode.giveaway.getEntries.mutate({
    giveawayId: giveawayId.toString(),
  });

  const winners = drawWinners(entries, giveaway.numOfWinners);
  const mentions = winners.map(winner => `<@${winner}>`).join(" ");
  const message = await channel.messages.fetch(giveaway.messageId);
  const newEmbed = new EmbedBuilder()
    .setTitle(giveaway.prize)
    .setColor(message.embeds[0]?.color ?? "#546e7a")
    .setDescription(
      `Winner${giveaway.numOfWinners > 1 ? "s" : ""}: ${mentions || "No eligible participants."}` +
      (giveaway.hostId ? `\n\nHosted by: <@${giveaway.hostId}>` : "")
    )
    .setFooter({ text: "Ended: " })
    .setTimestamp();
  await message.edit({
    content: "🎉Giveaway Ended🎉",
    embeds: [newEmbed],
  });
  const prizeLink = `[**${giveaway.prize}**](${message.url})`;
  const announcement = winners.length
    ? `${mentions} won ${prizeLink} in the reroll. Congratulations! 🎉`
    : `No eligible participants for the reroll of ${prizeLink}.`;
  const winnerEmbed = new EmbedBuilder()
    .setColor("#546e7a")
    .setDescription(announcement);

  return { channel, embed: winnerEmbed };
}
