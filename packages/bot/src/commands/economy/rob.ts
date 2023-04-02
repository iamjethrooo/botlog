import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import {
  CommandInteraction,
  GuildMember,
  Message,
  MessageEmbed,
} from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "rob",
  description: "Rob another user.",
  preconditions: ["inBotChannel", "isNotInmate"],
})
export class RobCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    const user = interaction.options.getUser("user", true);

    let victimId = user.id;
    let suspectId = interaction.user.id;
    let isMod = (<GuildMember>interaction.member)!.permissions.has(
      "ADMINISTRATOR"
    );
    let isThief = (<GuildMember>interaction.member)!.roles.cache.has(
      `${process.env.ROLE_ID_THIEF}`
    );

    try {
      let allItems = await trpcNode.item.getAll.query();

      let suspect = await trpcNode.user.getUserById.query({
        id: suspectId,
      });

      let luckPotion = allItems.allItems.find(
        (i) => i.name.toLowerCase() == "luck potion"
      );
      let fortuneAmulet = allItems.allItems.find(
        (i) => i.name.toLowerCase() == "fortune amulet"
      );

      let userInventory = await trpcNode.inventory.getByUserId.mutate({
        userId: suspectId,
      });

      let userHasLuckPotion = userInventory.inventory.some(
        (e) => e.itemId == luckPotion!.id
      );
      // Number of fortune amulets of the user
      let fortuneAmuletCount = userInventory.inventory.filter(
        (i) => i.itemId == fortuneAmulet!.id
      ).length;

      let suspectCash = suspect.user!.cash;

      let lastRobDate = Number(suspect.user!.lastRobDate);
      let robCooldown = isThief
        ? Number(process.env.ROB_COOLDOWN_THIEF)
        : Number(process.env.ROB_COOLDOWN);

      const embed = new MessageEmbed().setAuthor(
        `${interaction.user.username}#${interaction.user.discriminator}`,
        interaction.user.displayAvatarURL({ dynamic: true })
      );

      let tooSoon = (Date.now() - lastRobDate) / 1000 < robCooldown;
      if (tooSoon) {
        embed.setDescription(
          `⏲️ Too soon. You can attempt to rob another member in <t:${
            Math.round(lastRobDate / 1000) + robCooldown
          }:R>`
        );
        embed.setColor(`#${process.env.RED_COLOR}`);

        return await interaction.reply({ embeds: [embed] });
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
        (userHasLuckPotion ? Number(process.env.LUCKY_CHARM_INCREASE) : 0) +
        fortuneAmuletCount * Number(process.env.FORTUNE_AMULET_INCREASE);

      let success = Math.random() <= successChance;

      if (success) {
        let extraMessage = "";
        if (isMod) {
          await trpcNode.guild.addToBank.mutate({
            id: interaction.guildId!,
            amount: robAmount,
          });
          extraMessage = ` ${process.env.COIN_EMOJI}${robAmount} was added to the server bank.`;
        } else if (isThief) {
          await trpcNode.guild.addToThievesBank.mutate({
            id: interaction.guildId!,
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
          id: interaction.guildId!,
          amount: amountToBeSubtracted,
        });

        embed.setDescription(
          `❌ You were caught attempting to rob <@${victimId}> and have been fined ${process.env.COIN_EMOJI}${amountToBeSubtracted}.`
        );
        embed.setColor(`#${process.env.RED_COLOR}`);
      }

      // Remove luck potion from inventory
      if (userHasLuckPotion) {
        await trpcNode.inventory.delete.mutate({
          userId: suspectId,
          itemId: luckPotion!.id
        });
      }

      await trpcNode.user.updateLastRobDate.mutate({
        id: interaction.user.id,
        date: Date.now().toString(),
      });

      return await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.log(error);
      return;
    }
  }

  public override async messageRun(message: Message) {
    let hasNoMention = message.mentions.users.size < 1;
    if (hasNoMention) return;

    let victimId = message.mentions.users!.first()!.id;
    let suspectId = message.author.id;
    let isMod = message.member!.permissions.has("ADMINISTRATOR");
    let isThief = message.member!.roles.cache.has(
      `${process.env.ROLE_ID_THIEF}`
    );

    try {
      let allItems = await trpcNode.item.getAll.query();

      let suspect = await trpcNode.user.getUserById.query({
        id: suspectId,
      });

      let luckPotion = allItems.allItems.find(
        (i) => i.name.toLowerCase() == "luck potion"
      );
      let fortuneAmulet = allItems.allItems.find(
        (i) => i.name.toLowerCase() == "fortune amulet"
      );

      let userInventory = await trpcNode.inventory.getByUserId.mutate({
        userId: suspectId,
      });

      let userHasLuckPotion = userInventory.inventory.some(
        (e) => e.itemId == luckPotion!.id
      );
      // Number of fortune amulets of the user
      let fortuneAmuletCount = userInventory.inventory.filter(
        (i) => i.itemId == fortuneAmulet!.id
      ).length;

      let suspectCash = suspect.user!.cash;

      let lastRobDate = Number(suspect.user!.lastRobDate);
      let robCooldown = isThief
        ? Number(process.env.ROB_COOLDOWN_THIEF)
        : Number(process.env.ROB_COOLDOWN);

      const embed = new MessageEmbed().setAuthor(
        `${message.author.username}#${message.author.discriminator}`,
        message.author.displayAvatarURL({ dynamic: true })
      );

      let tooSoon = (Date.now() - lastRobDate) / 1000 < robCooldown;
      if (tooSoon) {
        embed.setDescription(
          `⏲️ Too soon. You can attempt to rob another member in <t:${
            Math.round(lastRobDate / 1000) + robCooldown
          }:R>`
        );
        embed.setColor(`#${process.env.RED_COLOR}`);

        return await message.channel.send({ embeds: [embed] });
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
        (userHasLuckPotion ? Number(process.env.LUCKY_CHARM_INCREASE) : 0) +
        fortuneAmuletCount * Number(process.env.FORTUNE_AMULET_INCREASE);

      let success = Math.random() <= successChance;

      if (success) {
        let extraMessage = "";
        if (isMod) {
          await trpcNode.guild.addToBank.mutate({
            id: message!.guildId!,
            amount: robAmount,
          });
          extraMessage = ` ${process.env.COIN_EMOJI}${robAmount} was added to the server bank.`;
        } else if (isThief) {
          await trpcNode.guild.addToThievesBank.mutate({
            id: message!.guildId!,
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
          id: message!.guildId!,
          amount: amountToBeSubtracted,
        });

        embed.setDescription(
          `❌ You were caught attempting to rob <@${victimId}> and have been fined ${process.env.COIN_EMOJI}${amountToBeSubtracted}.`
        );
        embed.setColor(`#${process.env.RED_COLOR}`);
      }

      // Remove luck potion from inventory
      if (userHasLuckPotion) {
        await trpcNode.inventory.delete.mutate({
          userId: suspectId,
          itemId: luckPotion!.id
        });
      }

      await trpcNode.user.updateLastRobDate.mutate({
        id: message.author.id,
        date: Date.now().toString(),
      });

      return await message.channel.send({ embeds: [embed] });
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
          type: "USER",
          required: true,
          name: "user",
          description: `Who do you want to rob?`,
        },
      ],
    });
  }
}
