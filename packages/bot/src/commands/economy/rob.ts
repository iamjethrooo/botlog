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

async function rob(
  user: User,
  victimId: string,
  isThief: boolean,
  isMod: boolean,
  guildId: string
) {
  let suspectId = user.id;
  let suspect = await trpcNode.user.getUserById.query({
    id: suspectId,
  });
  let suspectCash = suspect.user!.cash;

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
  let fortuneAmuletCount = suspectInventory.inventory.filter(
    (i) => i.itemId == fortuneAmulet!.id
  ).length;

  let lastRobDate = Number(suspect.user!.lastRobDate);
  let robCooldown = isThief
    ? Number(process.env.ROB_COOLDOWN_THIEF)
    : Number(process.env.ROB_COOLDOWN);

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
    embed.setColor(`#${process.env.RED_COLOR}`);

    return embed;
  }

  let victim = await trpcNode.user.getUserById.query({
    id: victimId,
  });

  let victimCash = victim.user!.cash;

  let robRate = isThief
    ? Number(process.env.ROB_RATE_THIEF)
    : Number(process.env.ROB_RATE);

  let robChance = isMod
    ? Number(process.env.ROB_CHANCE_MOD)
    : isThief
    ? Number(process.env.ROB_CHANCE_THIEF)
    : Number(process.env.ROB_CHANCE);

  let robAmount = Math.round(victimCash * robRate);

  let successChance =
    robChance +
    (suspectHasLuckPotion ? Number(process.env.LUCKY_CHARM_INCREASE) : 0) +
    fortuneAmuletCount * Number(process.env.FORTUNE_AMULET_INCREASE) +
    (suspectHasUnstablePotion
      ? randomlyAdjustNumber(Number(process.env.LUCKY_CHARM_INCREASE))
      : 0);

  let success = Math.random() <= successChance;

  if (success) {
    let extraMessage = "";
    if (isMod) {
      await trpcNode.guild.addToBank.mutate({
        id: guildId,
        amount: robAmount,
      });
      extraMessage = ` ${process.env.COIN_EMOJI}${robAmount} was added to the server bank.`;
    } else if (isThief) {
      await trpcNode.guild.addToThievesBank.mutate({
        id: guildId,
        amount: robAmount,
      });
      extraMessage = ` ${process.env.COIN_EMOJI}${robAmount} was added to the Thieves Guild's bank.`;
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
    embed.setDescription(
      `✅ You robbed ${process.env.COIN_EMOJI}${robAmount} from <@${victimId}>.${extraMessage}`
    );
    embed.setColor(`#${process.env.GREEN_COLOR}`);
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

    embed.setDescription(
      `❌ You were caught attempting to rob <@${victimId}> and have been fined ${process.env.COIN_EMOJI}${amountToBeSubtracted}.`
    );
    embed.setColor(`#${process.env.RED_COLOR}`);
  }

  // Remove luck potion from inventory
  if (suspectHasLuckPotion) {
    await trpcNode.inventory.delete.mutate({
      userId: suspectId,
      itemId: luckPotion!.id,
    });
  }

  // Remove unstable potion from inventory
  if (suspectHasUnstablePotion) {
    await trpcNode.inventory.delete.mutate({
      userId: suspectId,
      itemId: unstablePotion!.id,
    });
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

    let isThief = (<GuildMember>interaction.member)!.roles.cache.has(
      `${process.env.ROLE_ID_THIEF}`
    );

    try {
      let resultEmbed = await rob(
        interaction.user,
        victimId,
        isThief,
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
    let isThief = message.member!.roles.cache.has(
      `${process.env.ROLE_ID_THIEF}`
    );

    try {
      let resultEmbed = await rob(
        message.author,
        victimId,
        isThief,
        isMod,
        message.guildId!
      );
      return await message.channel.send({ embeds: [resultEmbed] });
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
