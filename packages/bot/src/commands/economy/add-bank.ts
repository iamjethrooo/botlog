import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Args,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "add-bank",
  description: "Add money to the server bank.",
  preconditions: ["inBotChannel", "userIsAdmin"],
})
export class AddBankCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message, args: Args) {
    try {
      let amount = await args.pick("integer").catch(() => 0);

      await trpcNode.guild.addToBank.mutate({
        id: message!.guildId!,
        amount: amount,
      });

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${message.author.username}#${message.author.discriminator}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setDescription(
          `✅ Added ${process.env.COIN_EMOJI}${String(amount)} to the bank.`
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
