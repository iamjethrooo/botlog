import { ChannelType, type Client } from "discord.js";
import { trpcNode } from "../trpc";

export async function giveawayChannel(
  client: Client,
  giveaway: { giveawayId: string; messageId: string; guildId: string | null; channelId: string | null },
  requestingGuildId?: string,
) {
  const channelId = giveaway.channelId ?? process.env.GIVEAWAY_CHANNEL_ID;
  if (!channelId) throw new Error("Giveaway channel requires operator review.");
  const channel = client.channels.cache.get(channelId) ?? await client.channels.fetch(channelId);
  if ((channel?.type !== ChannelType.GuildText && channel?.type !== ChannelType.GuildAnnouncement) ||
      (giveaway.guildId && channel.guildId !== giveaway.guildId) ||
      (requestingGuildId && channel.guildId !== requestingGuildId)) {
    throw new Error("Giveaway channel requires operator review.");
  }

  if (!giveaway.channelId) {
    // The configured channel is only a candidate for old records. Discord
    // message IDs are globally unique, so an exact match verifies the location.
    const original = await channel.messages.fetch({ message: giveaway.messageId, force: true });
    if (original.id !== giveaway.messageId || original.author.id !== client.user?.id) {
      throw new Error("Could not verify the original giveaway message.");
    }
    await trpcNode.giveaway.recordLegacyLocation.mutate({
      giveawayId: giveaway.giveawayId,
      messageId: giveaway.messageId,
      guildId: channel.guildId,
      channelId: channel.id,
    });
  }
  return channel;
}
