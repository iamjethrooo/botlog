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
  name: "take-bank",
  description: "Take money from the server bank.",
  preconditions: ["inBotChannel", "userIsAdmin"],
})
export class TakeBankCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message, args: Args) {
    const coinEmoji = await trpcNode.setting.getByKey.mutate({
      key: "coinEmoji",
    });
    const greenColor = await trpcNode.setting.getByKey.mutate({
      key: "greenColor",
    });
    try {
      let amount = await args.pick("integer").catch(() => 0);

      await trpcNode.guild.subtractFromBank.mutate({
        id: message!.guildId!,
        amount: amount,
      });

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${message.author.username}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setDescription(`✅ Took ${coinEmoji}${String(amount)} from the bank.`)
        .setTimestamp(message.createdAt)
        .setColor(`#${greenColor}`);
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
