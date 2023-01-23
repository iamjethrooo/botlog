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
  name: "withdraw",
  aliases: ["with"],
  description: "Deposit your cash to the bank.",
  enabled: false
})
export class WithdrawCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message, args: Args) {
    console.log("hello");
    const amount = (await args.rest("string")).trim();
    console.log(amount);
    try {
      let amountWithdrawn = 0;
      let user = await trpcNode.user.getUserById.query({
        id: message.author.id,
      });
      if (amount !== "all") {
        return;
      } else {
        amountWithdrawn = user!.user!.bank
      }
      console.log(amountWithdrawn);

      await trpcNode.user.withdraw.mutate({
        id: message.author.id,
        cash: amountWithdrawn,
      });
      console.log("hehe");

      const embed = new MessageEmbed()
        .setAuthor(
          `${message.author.username}#${message.author.discriminator}`,
          message.author.displayAvatarURL({ dynamic: true })
        )
        .setDescription(
          `✅ Withdrew <:baguiobenguetchat:854546677897625600>${amountWithdrawn} from your bank!`
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
          description: "How much do you want to withdraw?",
          required: true,
        },
      ],
    });
  }
}
