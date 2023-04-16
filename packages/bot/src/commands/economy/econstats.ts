import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";

@ApplyOptions<CommandOptions>({
  name: "econstats",
  description: "Displays current economy system statistics.",
  preconditions: ["inBotChannel"],
})
export class EconStatsCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message) {
    // process.env.
    const embed = new EmbedBuilder()
      .setAuthor({
        name: message.guild!.name,
        iconURL: message.guild!.iconURL()!,
      })
      .addFields(
        {
          name: "Coins per chat",
          value: `${process.env.COIN_EMOJI}${process.env.MIN_CASH_PER_CHAT} to ${process.env.COIN_EMOJI}${process.env.MAX_CASH_PER_CHAT}`,
          inline: true,
        },
        {
          name: "Interval between coin rewards",
          value: `\`${process.env.INTERVAL} seconds\``,
          inline: true,
        },
        { name: " ", value: ` `, inline: false },
        {
          name: "Snipe Cost",
          value: `${process.env.COIN_EMOJI}${process.env.SNIPE_COST}`,
          inline: true,
        },
        {
          name: "Single Snipe Cost",
          value: `${process.env.COIN_EMOJI}${process.env.SINGLE_SNIPE_COST}`,
          inline: true,
        },
        { name: " ", value: ` `, inline: false },
        {
          name: "Rob Success Rate",
          value: `\`${Number(process.env.ROB_CHANCE) * 100}%\``,
          inline: true,
        },
        {
          name: "Rob Earnings",
          value: `\`${Number(process.env.ROB_RATE) * 100}%\``,
          inline: true,
        },
        {
          name: "Rob Cooldown",
          value: `\`${Number(process.env.ROB_COOLDOWN) / 3600} hours\``,
          inline: true,
        },
        { name: " ", value: ` `, inline: false },
        {
          name: "Heist Success Rate",
          value: `\`${Number(process.env.HEIST_BASE_CHANCE) * 100}% + ${
            Number(process.env.HEIST_ADDITIONAL_CHANCE) * 100
          }% per additional member\``,
          inline: true,
        },
        {
          name: "Heist Earnings",
          value: `\`${Math.round(Number(process.env.HEIST_BASE_RATE) * 100)}% + ${
            Number(process.env.HEIST_ADDITIONAL_RATE) * 100
          }% per additional member\``,
          inline: true,
        },
        {
          name: "Heist Cooldown",
          value: `\`${Number(process.env.HEIST_COOLDOWN) / 3600} hours\``,
          inline: true,
        },
        {
          name: "Jail Time",
          value: `\`${Number(process.env.HEIST_JAIL_TIME) / 3600} hours - ${
            Number(process.env.HEIST_REDUCED_JAIL_TIME) / 60
          } minutes deducted per additional heist member\``,
          inline: true,
        }
        // { name: "", value: ``, inline: true },
      )
      .setColor(message.member!.displayHexColor);

    return await message.channel.send({ embeds: [embed] });
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
