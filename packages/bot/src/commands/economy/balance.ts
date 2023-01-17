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
  description: "Replies with Pong!",
})
export class BalanceCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message) {
    console.log(message);
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
          { name: "Cash:", value: '<:baguiobenguetchat:854546677897625600>' + String(user!.user!.cash), inline: true },
          { name: "Bank:", value: '<:baguiobenguetchat:854546677897625600>' + String(user!.user!.bank), inline: true },
          { name: "Total:", value: '<:baguiobenguetchat:854546677897625600>' + String(user!.user!.cash + user!.user!.bank), inline: true }
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
