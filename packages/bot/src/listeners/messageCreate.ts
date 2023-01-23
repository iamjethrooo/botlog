// @ts-nocheck
import { ApplyOptions } from "@sapphire/decorators";
import { Listener, ListenerOptions, container } from "@sapphire/framework";
import { Message, MessageEmbed, Util } from "discord.js";
import { trpcNode } from "../trpc";

const picsOnlyChannels = [
  "669514957938753558",
  "800543054221541376",
  "669514986548232193",
  "671669574961201157",
  "801677818760003594",
  "978228788561346571",
  "1044996825754644670",
];

const noCashChannels = [
  "682838969179832423",
  "1064926572680847490",
  "794833126270566411",
  "794833143113973760",
  "738754900992721028",
  "993892178893996032",
  "796684897594769418",
  "670801689770590208",
  "674518870211559428",
  "674860915383992340",
  "725110364773154896",
];

@ApplyOptions<ListenerOptions>({
  event: "messageCreate",
})
export class MessageListener extends Listener {
  public override async run(message: Message): Promise<void> {
    if (message.guild === null) return;

    const { client } = container;
    const isBot = message.author.bot;
    if (isBot) return;

    // Coinz
    try {
      if (noCashChannels.includes(message.channel.id)) {
        throw "no cash here";
      }

      let user = await trpcNode.user.getUserById.query({
        id: message.author.id,
      });

      if (user.user == null) {
        await trpcNode.user.create.mutate({
          id: message.author.id,
          name: message.author.username,
        });
        await trpcNode.user.addCash.mutate({
          id: message.author.id,
          cash: parseInt(process.env.STARTING_CASH),
        });
      } else {
        if (
          (Date.now() - Number(user.user.lastMessageDate)) / 1000 <
          process.env.INTERVAL
        ) {
          console.log("too soon!");
        } else {
          await trpcNode.user.addCash.mutate({
            id: message.author.id,
            cash: parseInt(process.env.CASH_PER_CHAT),
          });

          await trpcNode.user.updateLastMessageDate.mutate({
            id: message.author.id,
            date: Date.now().toString(),
          });
        }
      }
    } catch (error) {
      if (error === "no cash here") return;
      console.log(error);
      return;
    }

    // Removes text messages in media-only channels
    if (picsOnlyChannels.includes(message.channel.id)) {
      const isAdmin = message.member!.permissions.has("ADMINISTRATOR");
      if (!isAdmin) {
        // For discussions category
        if (!(message.attachments.size > 0 || message.embeds.length > 0)) {
          // Store values related to the message
          // discussionChannel: '735804432985620521'
          const discussionChannel =
            client.channels.cache.get("735804432985620521");
          const guildId = message.guild.id;
          const channelId = message.channel.id;
          const authorId = message.author.id;
          let content = message.content;
          let hasReplied = false;

          if (message.reference) hasReplied = true;
          message
            .delete()
            .then(
              message.channel
                .send(
                  `Don't chat here, please use the <#735804432985620521> channel above.`
                )
                .then((message) => setTimeout(() => message.delete(), 5000))
            );
          if (content.includes("@everyone") || content.includes("@here")) {
            content = Util.removeMentions(content);
          }

          let embed = new MessageEmbed()
            .setAuthor(
              `${message.author.username}#${message.author.discriminator}`,
              message.author.displayAvatarURL({ dynamic: true })
            )
            .addField("Message content:", content)
            .setTimestamp(message.createdAt)
            .setColor(message.member!.displayHexColor)
            .setFooter("#".concat(message.channel.name));
          discussionChannel!.send(`<@${authorId}>`);
          // If author replied to a message
          if (hasReplied) {
            let referenceId = message.reference!.messageId!;
            embed.addField(
              "Replied to:",
              `[Click to jump to message.](https://discord.com/channels/${guildId}/${channelId}/${referenceId})`
            );
            return discussionChannel!.send({ embeds: [embed] });
          }

          return discussionChannel!.send({ embeds: [embed] });
        }
      }
    }
  }
}
