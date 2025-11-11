import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import {
  GuildMember,
  Message,
  EmbedBuilder,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  User,
  TextChannel,
} from "discord.js";
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

function generateRandomNumber(min: number, max: number) {
  // Generate a random number between 0 and 1
  const randomFraction = Math.random();

  // Scale and shift the random number to the desired range (100 to 500)
  const randomNumberInRange =
    Math.floor(randomFraction * (max - min + 1)) + min;

  return randomNumberInRange;
}

async function rob(
  user: User,
  victimId: string,
  isMod: boolean,
  guildId: string
) {
  isMod = false;
  let suspectId = user.id;
  let suspect = await trpcNode.user.getUserById.query({
    id: suspectId,
  });
  let suspectCash = suspect.user!.cash;
  const failedRobAttempts = suspect.user!.failedRobAttempts;

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

  let sentryWard = allItems.allItems.find(
    (i) => i.name.toLowerCase() == "sentry ward"
  );

  let suspectInventory = await trpcNode.inventory.getByUserId.mutate({
    userId: suspectId,
  });

  let suspectHasLuckPotion = suspectInventory.inventory.some(
    (e) => e.itemId == luckPotion!.id
  );

  let suspectHasUnstablePotion = suspectInventory.inventory.some(
    (e) => e.itemId == unstablePotion!.id
  );

  // Number of fortune amulets of the suspect
  let fortuneAmuletInv = suspectInventory.inventory.filter(
    (i) => i.itemId == fortuneAmulet!.id
  );
  let fortuneAmuletCount =
    fortuneAmuletInv.length != 0 ? fortuneAmuletInv[0].amount : 0;

  // Number of sentry wards of the victim
  let victimInventory = await trpcNode.inventory.getByUserId.mutate({
    userId: victimId,
  });
  let sentryWardInv = victimInventory.inventory.filter(
    (i) => i.itemId == sentryWard!.id
  );
  let sentryWardCount = sentryWardInv.length != 0 ? sentryWardInv[0].amount : 0;

  const coinEmoji = await trpcNode.setting.getByKey.mutate({
    key: "coinEmoji",
  });
  const greenColor = await trpcNode.setting.getByKey.mutate({
    key: "greenColor",
  });
  const redColor = await trpcNode.setting.getByKey.mutate({
    key: "redColor",
  });
  const robChance = Number(
    await trpcNode.setting.getByKey.mutate({
      key: "robChance",
    })
  );
  const robCooldown = Number(
    await trpcNode.setting.getByKey.mutate({
      key: "robCooldown",
    })
  );
  const luckyCharmIncrease = await trpcNode.setting.getByKey.mutate({
    key: "luckyCharmIncrease",
  });
  const fortuneAmuletIncrease = await trpcNode.setting.getByKey.mutate({
    key: "fortuneAmuletIncrease",
  });
  const sentryWardDecrease = await trpcNode.setting.getByKey.mutate({
    key: "sentryWardDecrease",
  });
  const robMin = await trpcNode.setting.getByKey.mutate({
    key: "robMin",
  });
  const robMax = await trpcNode.setting.getByKey.mutate({
    key: "robMax",
  });

  let lastRobDate = Number(suspect.user!.lastRobDate);

  const embed = new EmbedBuilder().setAuthor({
    name: `${user.username}#${user.discriminator}`,
    iconURL: user.displayAvatarURL(),
  });

  let tooSoon = (Date.now() - lastRobDate) / 1000 < robCooldown;
  if (tooSoon) {
    embed.setDescription(
      `⏲️ Too soon. You can attempt to rob another member in <t:${
        Math.round(lastRobDate / 1000) + robCooldown
      }:R>`
    );
    embed.setColor(`#${redColor}`);

    return embed;
  }

  let victim = await trpcNode.user.getUserById.query({
    id: victimId,
  });

  const bodyguardDuration = Number(
    await trpcNode.setting.getByKey.mutate({
      key: "bodyguardDuration",
    })
  );
  let victimCash = victim.user!.cash;

  let robAmount = generateRandomNumber(Number(robMin), Number(robMax));
  // if (
  //     suspectId == "746430201298419863" &&
  //     victimId == "881910448818098186"
  //   ) {
  //     robAmount = generateRandomNumber(100, 200)
  //   }
  robAmount = robAmount > victimCash ? victimCash : robAmount;

  let successChance =
    robChance +
    (suspectHasLuckPotion ? Number(luckyCharmIncrease) : 0) +
    fortuneAmuletCount * Number(fortuneAmuletIncrease) +
    (suspectHasUnstablePotion
      ? randomlyAdjustNumber(Number(luckyCharmIncrease))
      : 0) +
    failedRobAttempts * 0.1 -
    sentryWardCount * Number(sentryWardDecrease);
  if (
    Number(victim.user?.lastBodyguardDate) +
      Math.round(bodyguardDuration * 1000) >
    Date.now()
  ) {
    successChance -= 0.85;
  }
  else if (
    suspectId == "746430201298419863" && // strep
    victimId == "881910448818098186" // alex
  ) {
    successChance = 0;
  }

  let roll = Math.random();
  let success = roll <= successChance;
  console.log(
    `Robber: ${user.username}, Success Chance: ${successChance}, Roll: ${roll}`
  );
  if (success) {
    let extraMessage = "";
    if (isMod) {
      let robTax = Math.round(robAmount * Number(0.25));
      await trpcNode.guild.addToBank.mutate({
        id: guildId,
        amount: robTax,
      });
      await trpcNode.user.addCash.mutate({
        id: suspectId,
        cash: robAmount - robTax,
      });
      extraMessage = ` ${coinEmoji}${robTax} was added to the server bank.`;
    } else {
      await trpcNode.user.addCash.mutate({
        id: suspectId,
        cash: robAmount,
      });
    }

    await trpcNode.user.subtractCash.mutate({
      id: victimId,
      cash: robAmount,
    });

    await trpcNode.user.setFailedRobAttempts.mutate({
      id: suspectId,
      failedRobAttempts: 0,
    });
    embed.setDescription(
      `✅ You robbed ${coinEmoji}${robAmount} from <@${victimId}>.${extraMessage}`
    );
    embed.setColor(`#${greenColor}`);
  } else {
    let amountToBeSubtracted =
      suspectCash > robAmount ? robAmount : suspectCash;

    await trpcNode.user.subtractCash.mutate({
      id: suspectId,
      cash: amountToBeSubtracted,
    });

    await trpcNode.guild.addToBank.mutate({
      id: guildId,
      amount: amountToBeSubtracted,
    });

    await trpcNode.user.setFailedRobAttempts.mutate({
      id: suspectId,
      failedRobAttempts: failedRobAttempts + 1,
    });

    embed.setDescription(
      `❌ You were caught attempting to rob <@${victimId}> and have been fined ${coinEmoji}${amountToBeSubtracted}.`
    );
    embed.setColor(`#${redColor}`);
  }
  const consumedItems: string[] = [];
  // Remove luck potion from inventory
  if (suspectHasLuckPotion) {
    consumedItems.push(`${luckPotion!.emoji}**Luck Potion**`);
    await trpcNode.inventory.delete.mutate({
      userId: suspectId,
      itemId: luckPotion!.id,
    });
  }

  // Remove unstable potion from inventory
  if (suspectHasUnstablePotion) {
    consumedItems.push(`${unstablePotion!.emoji}**Unstable Potion**`);
    await trpcNode.inventory.delete.mutate({
      userId: suspectId,
      itemId: unstablePotion!.id,
    });
  }

  if (consumedItems.length == 1) {
    embed.setDescription(
      embed.toJSON().description! +
        `\n\nYour ${consumedItems.toString()} was consumed during the robbery.`
    );
  } else if (consumedItems.length > 1) {
    embed.setDescription(
      embed.toJSON().description! +
        `\n\nYour ${consumedItems.join(
          " and "
        )} were consumed during the robbery.`
    );
  }

  await trpcNode.user.updateLastRobDate.mutate({
    id: user.id,
    date: Date.now().toString(),
  });

  return embed;
}
@ApplyOptions<CommandOptions>({
  name: "rob",
  description: "Rob another user.",
  preconditions: ["inBotChannel", "isNotInmate"],
})
export class RobCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user", true);

    let victimId = user.id;
    let isMod = (<GuildMember>interaction.member)!.permissions.has(
      "Administrator"
    );

    try {
      let resultEmbed = await rob(
        interaction.user,
        victimId,
        isMod,
        interaction.guildId!
      );
      return await interaction.reply({ embeds: [resultEmbed] });
    } catch (error) {
      console.log(error);
      return;
    }
  }

  public override async messageRun(message: Message) {
    let hasNoMention = message.mentions.users.size < 1;
    if (hasNoMention) return;

    let victimId = message.mentions.users!.first()!.id;
    let isMod = message.member!.permissions.has("Administrator");

    try {
      let resultEmbed = await rob(
        message.author,
        victimId,
        isMod,
        message.guildId!
      );
      return await (message.channel as TextChannel).send({ embeds: [resultEmbed] });
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
          type: ApplicationCommandOptionType.User,
          required: true,
          name: "user",
          description: `Who do you want to rob?`,
        },
      ],
    });
  }
}
