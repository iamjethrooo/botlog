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
    // let isMod = message.member!.permissions.has("Administrator");

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

    const coinEmoji = await trpcNode.setting.getByKey.mutate({
      key: "coinEmoji",
    });
    const interval = await trpcNode.setting.getByKey.mutate({
      key: "interval",
    });
    const minCashPerChat = await trpcNode.setting.getByKey.mutate({
      key: "minCashPerChat",
    });
    const maxCashPerChat = await trpcNode.setting.getByKey.mutate({
      key: "maxCashPerChat",
    });
    const robChance = Number(
      await trpcNode.setting.getByKey.mutate({
        key: "robChance",
      })
    );
    const luckyCharmIncrease = await trpcNode.setting.getByKey.mutate({
      key: "luckyCharmIncrease",
    });
    const fortuneAmuletIncrease = await trpcNode.setting.getByKey.mutate({
      key: "fortuneAmuletIncrease",
    });
    const snipeCost = await trpcNode.setting.getByKey.mutate({
      key: "snipeCost",
    });
    const singleSnipeCost = await trpcNode.setting.getByKey.mutate({
      key: "singleSnipeCost",
    });
    const robCooldown = await trpcNode.setting.getByKey.mutate({
      key: "robCooldown",
    });
    const heistCooldown = await trpcNode.setting.getByKey.mutate({
      key: "heistCooldown",
    });
    const heistAdditionalRate = await trpcNode.setting.getByKey.mutate({
      key: "heistAdditionalRate",
    });
    const heistBaseRate = await trpcNode.setting.getByKey.mutate({
      key: "heistBaseRate",
    });
    const heistAdditionalChance = await trpcNode.setting.getByKey.mutate({
      key: "heistAdditionalChance",
    });
    const heistBaseChance = await trpcNode.setting.getByKey.mutate({
      key: "heistBaseChance",
    });
    const heistReducedJailTime = await trpcNode.setting.getByKey.mutate({
      key: "heistReducedJailTime",
    });
    const heistJailTime = await trpcNode.setting.getByKey.mutate({
      key: "heistJailTime",
    });

    let userInventory = await trpcNode.inventory.getByUserId.mutate({
      userId: message.author.id,
    });

    let userHasLuckPotion = userInventory.inventory.some(
      (e) => e.itemId == luckPotion!.id
    );

    let userHasUnstablePotion = userInventory.inventory.some(
      (e) => e.itemId == unstablePotion!.id
    );

    let fortuneAmuletInv = userInventory.inventory.filter(
      (i) => i.itemId == fortuneAmulet!.id
    );
    let fortuneAmuletCount =
      fortuneAmuletInv.length != 0 ? fortuneAmuletInv[0].amount : 0;

    let successChance =
      robChance +
      (userHasLuckPotion ? Number(luckyCharmIncrease) : 0) +
      fortuneAmuletCount * Number(fortuneAmuletIncrease) +
      (userHasUnstablePotion
        ? randomlyAdjustNumber(Number(luckyCharmIncrease))
        : 0);

    const embed = new EmbedBuilder()
      .setAuthor({
        name: message.guild!.name,
        iconURL: message.guild!.iconURL()!,
      })
      .addFields(
        {
          name: "Coins per chat",
          value: `${coinEmoji}${minCashPerChat} to ${coinEmoji}${maxCashPerChat}`,
          inline: true,
        },
        {
          name: "Interval between coin rewards",
          value: `\`${interval} seconds\``,
          inline: true,
        },
        { name: " ", value: ` `, inline: false },
        {
          name: "Snipe Cost",
          value: `${coinEmoji}${snipeCost}`,
          inline: true,
        },
        {
          name: "Single Snipe Cost",
          value: `${coinEmoji}${singleSnipeCost}`,
          inline: true,
        },
        { name: " ", value: ` `, inline: false },
        {
          name: "Rob Success Rate",
          value: `\`${Math.round(Number(successChance) * 100)}%\``,
          inline: true,
        },
        // {
        //   name: "Rob Earnings",
        //   value: `\`${Number(robRate) * 100}%\``,
        //   inline: true,
        // },
        {
          name: "Rob Cooldown",
          value: `\`${Number(robCooldown) / 3600} hours\``,
          inline: true,
        },
        { name: " ", value: ` `, inline: false },
        {
          name: "Heist Success Rate",
          value: `\`${Number(heistBaseChance) * 100}% + ${
            Number(heistAdditionalChance) * 100
          }% per additional member\``,
          inline: true,
        },
        {
          name: "Heist Earnings",
          value: `\`${Math.round(Number(heistBaseRate) * 100)}% + ${
            Number(heistAdditionalRate) * 100
          }% per additional member\``,
          inline: true,
        },
        {
          name: "Heist Cooldown",
          value: `\`${Number(heistCooldown) / 3600} hours\``,
          inline: true,
        },
        {
          name: "Jail Time",
          value: `\`${Number(heistJailTime) / 3600} hours - ${
            Number(heistReducedJailTime) / 60
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
