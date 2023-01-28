import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
  Args,
} from "@sapphire/framework";
import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "deposit",
  aliases: ["dep"],
  description: "Deposit your cash to the bank.",
  preconditions: [
    'inBotChannel'
  ],
  enabled: false
})
export class DepositCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {

  }

  public override async messageRun(message: Message, args: Args) {
    const amount = (await args.rest("string")).trim();
    console.log(amount);
    try {
      let amountDeposited = 0;
      let user = await trpcNode.user.getUserById.query({
        id: message.author.id,
      });
      if (amount !== "all") {
        return;
      } else {
        amountDeposited = user!.user!.cash;
      }

      await trpcNode.user.deposit.mutate({
        id: message.author.id,
        cash: amountDeposited,
      });
      console.log("hehe");

      const embed = new MessageEmbed()
        .setAuthor(
          `${message.author.username}#${message.author.discriminator}`,
          message.author.displayAvatarURL({ dynamic: true })
        )
        .setDescription(
          `✅ Deposited <:baguiobenguetchat:854546677897625600>${amountDeposited} to your bank!`
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
      options: [
        {
          name: "query",
          type: "STRING",
          description: "How much do you want to deposit?",
          required: true,
        },
      ],
    });
  }
}
