import { ApplyOptions } from "@sapphire/decorators";
import { Listener, ListenerOptions } from "@sapphire/framework";
import type { MessageReaction, User } from "discord.js";
import { trpcNode } from "../trpc";

@ApplyOptions<ListenerOptions>({
  event: "messageReactionAdd",
})
export class MessageReactionAddListener extends Listener {
  public override async run(
    messageReaction: MessageReaction,
    user: User
  ): Promise<void> {
    if (messageReaction.partial) {
      try {
        await messageReaction.fetch();
      } catch (error) {
        console.error(
          `Something went wrong when fetching the message: ${error}`
        );
      }
    }

    const message = messageReaction.message;
    let count = message.reactions.cache.get("⭐")?.count;
    count = count == undefined ? 0 : count;
    if (count >= 6) {
      const messageInStarboard =
        await trpcNode.starboardMessage.getByMessageId.mutate({
          messageId: message.id,
        });

      if (messageInStarboard.message.length == 0) {
        await trpcNode.starboardMessage.create.mutate({
          messageId: message.id,
          channelId: message.channelId,
        });

        await trpcNode.user.addCash.mutate({
          id: message.author!.id,
          cash: 200,
        });
      }
    }
  }
}
