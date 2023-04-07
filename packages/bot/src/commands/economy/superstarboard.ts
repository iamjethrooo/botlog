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
    console.log(user!.user!.cash);

    const starboardCost = Number(process.env.STARBOARD_COST);

    const embed = new EmbedBuilder().setAuthor({
      name: `${message.author.username}#${message.author.discriminator}`,
      iconURL: message.author.displayAvatarURL(),
    });

    let insufficientFunds = user!.user!.cash < starboardCost;
    console.log(insufficientFunds);
    if (insufficientFunds) {
      embed.setDescription(
        `❌ You do not have enough money to send this message to the starboard channel!`
      );
      embed.setColor(`#${process.env.RED_COLOR}`);
      return await message.channel.send({ embeds: [embed] });
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
          .setColor(`#${process.env.RED_COLOR}`);
      } else {
        const { client } = container;
        const guildId = reference.guildId;
        const channelId = reference.channelId;
        const referenceId = reference.id;

        const starboardChannel = <TextChannel>(
          client.channels.cache.get(String(process.env.STARBOARD_CHANNEL_ID))
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
        await trpcNode.user.subtractCash.mutate({
          id: userId,
          cash: starboardCost,
        });

        embed
          .setDescription(
            `✅ The message has been sent to the starboard channel!`
          )
          .setColor(`#${process.env.GREEN_COLOR}`);
      }

      return await message.reply({ embeds: [embed] });
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
