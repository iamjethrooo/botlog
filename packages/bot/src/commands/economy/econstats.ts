import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { trpcNode } from "../../trpc";

function randomlyAdjustNumber(num: number): number {
  const random = Math.random(); // Generate a random number between 0 and 1

  // Check if the random number is less than 0.5
  if (random < 0.5) {
    // If the random number is less than 0.5, make the number negative
    return -Math.abs(num);
  } else {
    // If the random number is greater than or equal to 0.5, retain the number's positivity
    return Math.abs(num);
  }
}

@ApplyOptions<CommandOptions>({
  name: "econstats",
  description: "Displays current economy system statistics.",
  preconditions: ["inBotChannel"],
})
export class EconStatsCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message) {
    let isMod = message.member!.permissions.has("Administrator");
    let isThief = message.member!.roles.cache.has(
      `${process.env.ROLE_ID_THIEF}`
    );

    let allItems = await trpcNode.item.getAll.query();

    let luckPotion = allItems.allItems.find(
      (i) => i.name.toLowerCase() == "luck potion"
    );

    let fortuneAmulet = allItems.allItems.find(
      (i) => i.name.toLowerCase() == "fortune amulet"
    );

    let unstablePotion = allItems.allItems.find(
      (i) => i.name.toLowerCase() == "unstable potion"
    );

    let robRate = isThief
      ? Number(process.env.ROB_RATE_THIEF)
      : Number(process.env.ROB_RATE);

    let robChance = isMod
      ? Number(process.env.ROB_CHANCE_MOD)
      : isThief
      ? Number(process.env.ROB_CHANCE_THIEF)
      : Number(process.env.ROB_CHANCE);

    let userInventory = await trpcNode.inventory.getByUserId.mutate({
      userId: message.author.id,
    });

    let userHasLuckPotion = userInventory.inventory.some(
      (e) => e.itemId == luckPotion!.id
    );

    let userHasUnstablePotion = userInventory.inventory.some(
      (e) => e.itemId == unstablePotion!.id
    );

    let fortuneAmuletCount = userInventory.inventory.filter(
      (i) => i.itemId == fortuneAmulet!.id
    ).length;

    let successChance =
      robChance +
      (userHasLuckPotion ? Number(process.env.LUCKY_CHARM_INCREASE) : 0) +
      fortuneAmuletCount * Number(process.env.FORTUNE_AMULET_INCREASE) +
      (userHasUnstablePotion
        ? randomlyAdjustNumber(Number(process.env.LUCKY_CHARM_INCREASE))
        : 0);
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
          value: `\`${Math.round(Number(successChance) * 100)}%\``,
          inline: true,
        },
        {
          name: "Rob Earnings",
          value: `\`${Number(robRate) * 100}%\``,
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
          value: `\`${Math.round(
            Number(process.env.HEIST_BASE_RATE) * 100
          )}% + ${
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
