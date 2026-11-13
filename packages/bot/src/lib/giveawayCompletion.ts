import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, DiscordAPIError, EmbedBuilder, type NewsChannel, type TextChannel } from "discord.js";
import { trpcNode } from "../trpc";

type Giveaway = NonNullable<Awaited<ReturnType<typeof trpcNode.giveaway.getById.mutate>>>;

// One ticket per entry; remove all of a winner's tickets before the next draw.
// Preserve the existing excluded-user rule and unique-winner semantics.
export function drawWinners(entries: { userId: string }[], count: number) {
  if (!Number.isInteger(count) || count < 1) throw Error("Invalid winner count");
  let tickets = entries.map(entry => entry.userId).filter(id => id !== "496523098439548929");
  const winners: string[] = [];
  while (winners.length < count && tickets.length) {
    const winner = tickets[Math.floor(Math.random() * tickets.length)];
    winners.push(winner);
    tickets = tickets.filter(id => id !== winner);
  }
  return winners;
}

// The disabled Join button's custom ID is an invisible delivery checkpoint.
// This requires the existing single bot process/scheduler guard. It is not a
// distributed lock or a transaction spanning PostgreSQL and Discord.
export async function completeGiveaway(giveaway: Giveaway, channel: NewsChannel | TextChannel) {
  const id = giveaway.giveawayId;
  let message = await channel.messages.fetch({ message: giveaway.messageId, force: true });
  const checkpoint = message.components.flatMap(row => row.type === ComponentType.ActionRow ? row.components : [])
    .find(component => component.customId?.startsWith(`${id}-Join-`))?.customId;
  let phase = checkpoint?.slice(`${id}-Join-`.length);
  if (!phase) {
    // Old completion without a checkpoint may already have announced. Do not
    // guess or redraw after upgrading an interrupted pre-BBC-14 execution.
    if (message.content === "🎉Giveaway Ended🎉") throw Error(`Legacy completion requires review (${id})`);
    const entries = await trpcNode.giveaway.getCompletionEntries.mutate({ giveawayId: id });
    const winners = drawWinners(entries, giveaway.numOfWinners);
    const winnerString = winners.map(winner => `<@${winner}>`).join(" ");
    const embed = new EmbedBuilder()
      .setTitle(giveaway.prize).setColor(message.embeds[0]?.color ?? "#546e7a")
      .setDescription(`Winner${giveaway.numOfWinners > 1 ? "s" : ""}: ${winnerString || "No eligible participants."}${giveaway.hostId ? `\n\nHosted by: <@${giveaway.hostId}>` : ""}`)
      .setFooter({ text: "Ended: " }).setTimestamp();
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`${id}-Join-drawn`).setLabel(String(new Set(entries.map(entry => entry.userId)).size))
        .setEmoji("🎉").setStyle(ButtonStyle.Primary).setDisabled(true),
      new ButtonBuilder().setCustomId(`${id}-Participants`).setLabel("Participants").setEmoji("👥").setStyle(ButtonStyle.Secondary)
    );
    // Persist winners before sending. An unknown edit outcome is re-read on the
    // next attempt; no network error causes an immediate redraw or resend.
    message = await message.edit({ content: "🎉Giveaway Ended🎉", embeds: [embed], components: [buttons] });
    phase = "drawn";
  }
  const mark = async (next: string) => {
    const rows = message.components.flatMap(row => row.type === ComponentType.ActionRow ? [
      new ActionRowBuilder<ButtonBuilder>().addComponents(row.components.flatMap(component => {
        if (component.type !== ComponentType.Button) return [];
        const button = ButtonBuilder.from(component.toJSON());
        if (component.customId?.startsWith(`${id}-Join-`)) button.setCustomId(`${id}-Join-${next}`);
        return [button];
      }))
    ] : []);
    message = await message.edit({ components: rows });
  };
  const marker = `Giveaway ${id}`;
  if (phase === "sending") {
    // A send may have reached Discord even when its response was lost. Search a
    // bounded page; absence is inconclusive, so never send again automatically.
    const recent = await channel.messages.fetch({ limit: 100 });
    const delivered = recent.find(candidate => candidate.author.id === message.author.id &&
      candidate.embeds.some(embed => embed.footer?.text === marker));
    if (!delivered) throw Error(`Announcement outcome uncertain; inspect channel and checkpoint before recovery (${id})`);
    await mark(`sent-${delivered.id}`);
  } else if (phase === "drawn") {
    const description = message.embeds[0]?.description;
    if (!description?.startsWith("Winner")) throw Error(`Missing persisted winners (${id})`);
    const winnerString = description.split("\n\nHosted by:")[0].replace(/^Winners?: /, "").trim();
    const noWinners = winnerString === "No eligible participants.";
    const congratulations = `Congratulations to ${winnerString}!🎉`;
    const embed = new EmbedBuilder().setColor("#546e7a").setFooter({ text: marker })
      .setDescription(noWinners ? `No eligible participants for the giveaway of [**${giveaway.prize}**](${message.url}).` :
        `${winnerString} won the giveaway of [**${giveaway.prize}**](${message.url})\n\n- Reroll Command: \`bbc reroll ${id}\``);
    await mark("sending");
    let announcement;
    try {
      announcement = await channel.send({
        content: noWinners ? "🎉Giveaway Ended🎉" : congratulations.length <= 2000 ? congratulations : "Congratulations to the winners!🎉",
        embeds: [embed], nonce: id, enforceNonce: true,
      });
    } catch (error) {
      // An explicit client rejection did not create a message. Transport and
      // server failures remain uncertain and retain the sending checkpoint.
      if (error instanceof DiscordAPIError && error.status >= 400 && error.status < 500 && error.status !== 429)
        await mark("drawn");
      throw error;
    }
    await mark(`sent-${announcement.id}`);
  } else if (!/^sent-\d{17,20}$/.test(phase)) {
    throw Error(`Invalid completion checkpoint (${id})`);
  }
  await trpcNode.giveaway.endGiveaway.mutate({ giveawayId: id });
}
