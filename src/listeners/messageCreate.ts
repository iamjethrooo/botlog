// @ts-nocheck
import { ApplyOptions } from "@sapphire/decorators";
import { Listener, ListenerOptions, container } from "@sapphire/framework";
import { Message, MessageEmbed, Util } from "discord.js";
const picsOnlyChannels = [
  "669514957938753558",
  "800543054221541376",
  "669514986548232193",
  "671669574961201157",
  "801677818760003594",
  "978228788561346571",
  "1044996825754644670",
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

    // Removes text messages in media-only channels
    if (picsOnlyChannels.includes(message.channel.id)) {
      const isAdmin = message.member!.permissions.has("ADMINISTRATOR");
      if (!isAdmin) {
        // For discussions category
        if (!(message.attachments.size > 0 || message.embeds.length > 0)) {
          // Store values related to the message
          // discussionChannel: '735804432985620521'
          const discussionChannel =
            client.channels.cache.get("901646890817445948");
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
