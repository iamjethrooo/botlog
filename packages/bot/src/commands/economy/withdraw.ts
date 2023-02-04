import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Args,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "withdraw",
  aliases: ["with"],
  description: "Withdraw from the server bank.",
  preconditions: ["inBotChannel"],
})
export class WithdrawCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message, args: Args) {
    if (!message.member!.permissions.has("ADMINISTRATOR")) {
      return;
    }

    try {
      let amount = await args.pick("integer").catch(() => 0);

      await trpcNode.guild.subtractFromBank.mutate({
        id: message!.guildId!,
        amount: amount,
      });

      const embed = new MessageEmbed()
        .setAuthor(
          `${message.author.username}#${message.author.discriminator}`,
          message.author.displayAvatarURL({ dynamic: true })
        )
        .setDescription(
          `✅ Withdrew ${process.env.COIN_EMOJI}${String(
            amount
          )} from the bank.`
        )
        .setTimestamp(message.createdAt)
        .setColor(`#${process.env.GREEN_COLOR}`);
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
