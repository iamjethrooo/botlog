import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
  container,
} from "@sapphire/framework";
import {
  CommandInteraction,
  EmbedBuilder,
  Message,
  TextChannel,
} from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "superstarboard",
  aliases: ["superstar", "starboard"],
  description: "Sends a message to the starboard channel.",
})
export class SuperStarboardCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message) {
    let userId = message.author.id;
    let user = await trpcNode.user.getUserById.query({
      id: userId,
    });
    const greenColor = await trpcNode.setting.getByKey.mutate({
      key: "greenColor",
    });
    const redColor = await trpcNode.setting.getByKey.mutate({
      key: "redColor",
    });
    const starboardCost = Number(
      await trpcNode.setting.getByKey.mutate({
        key: "starboardCost",
      })
    );
    const starboardChannelId = await trpcNode.setting.getByKey.mutate({
      key: "starboardChannelId",
    });

    const isMod = message.member!.permissions.has("Administrator");
    const embed = new EmbedBuilder().setAuthor({
      name: `${message.author.username}#${message.author.discriminator}`,
      iconURL: message.author.displayAvatarURL(),
    });

    if (!isMod) {
      let insufficientFunds = user!.user!.cash < starboardCost;
      console.log(insufficientFunds);
      if (insufficientFunds) {
        embed.setDescription(
          `❌ You do not have enough money to send this message to the starboard channel!`
        );
        embed.setColor(`#${redColor}`);
        return await message.channel.send({ embeds: [embed] });
      }
    }

    const reference = await message.fetchReference();
    if (reference) {
      // Check if message exists in starboard
      const messageIsInStarboard =
        await trpcNode.starboardMessage.getByMessageId.mutate({
          messageId: reference.id,
        });

      if (messageIsInStarboard.message.length != 0) {
        embed
          .setDescription(`❌ The message is already in the starboard channel!`)
          .setColor(`#${redColor}`);
      } else {
        const { client } = container;
        const guildId = reference.guildId;
        const channelId = reference.channelId;
        const referenceId = reference.id;

        const starboardChannel = <TextChannel>(
          client.channels.cache.get(String(starboardChannelId))
        );
        // Add to database
        await trpcNode.starboardMessage.create.mutate({
          messageId: reference.id,
          channelId: reference.channelId,
        });

        const starboardEmbed = new EmbedBuilder()
          .setAuthor({
            name: `${reference.author.username}#${reference.author.discriminator}`,
            iconURL: reference.author.displayAvatarURL(),
          })
          .setDescription(reference.content)
          .setTimestamp(reference.createdAt)
          .addFields({
            name: "**Source**",
            value: `[Jump!](https://discord.com/channels/${guildId}/${channelId}/${referenceId})`,
          })
          .setColor(`#ffdd78`);
        if (reference.channel instanceof TextChannel) {
          starboardEmbed.setFooter({
            text: "#".concat(reference.channel.name),
          });
        }

        starboardChannel.send({ embeds: [starboardEmbed] });

        // Subtract funds
        if (!isMod) {
          await trpcNode.user.subtractCash.mutate({
            id: userId,
            cash: starboardCost,
          });
        }

        embed
          .setDescription(
            `✅ The message has been sent to the starboard channel!`
          )
          .setColor(`#${greenColor}`);
      }

      return await message
        .reply({ embeds: [embed] })
        .then((message) => setTimeout(() => message.delete(), 15000))
        .then(message.delete);
    }
    return;
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
