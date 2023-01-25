import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "balance",
  aliases: ["bal"],
  description: "Check your balance.",
})
export class BalanceCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message) {
    if (
      message.guildId == "669190303353143306" &&
      message.channelId != "682838969179832423"
    ) {
      return;
    }
    try {
      let user = await trpcNode.user.getUserById.query({
        id: message.author.id,
      });

      const embed = new MessageEmbed()
        .setAuthor(
          `${message.author.username}#${message.author.discriminator}`,
          message.author.displayAvatarURL({ dynamic: true })
        )
        .addFields(
          {
            name: "Cash:",
            value:
              "<:baguiobenguetchat:854546677897625600>" +
              String(user!.user!.cash),
            inline: true,
          },
        )
        .setTimestamp(message.createdAt)
        .setColor(message.member!.displayHexColor);
      return await message.reply({ embeds: [embed] });
    } catch (error) {
      console.log(error);
      return;
    }
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
