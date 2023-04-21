import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Args,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import {
  CommandInteraction,
  Message,
  EmbedBuilder,
  GuildMember,
} from "discord.js";
import { trpcNode } from "../../trpc";

async function buy(itemName: string, customer: GuildMember) {
  let argumentIsNumber = false;
  let userId = customer.id;
  let shop = await trpcNode.item.getAll.query();
  let user = await trpcNode.user.getUserById.query({
    id: userId,
  });
  let item;
  let number = -1;
  try {
    number = Number(itemName);
    argumentIsNumber = isNaN(number) ? false : true;
  } catch (error) {
    console.log(error);
  }

  if (argumentIsNumber) {
    item = shop.allItems[number - 1];
  } else {
    shop.allItems.forEach((i) => {
      if (i.name.toLowerCase() == itemName.toLowerCase()) {
        item = i;
      }
    });
  }

  const embed = new EmbedBuilder().setAuthor({
    name: `${customer.user.username}#${customer.user.discriminator}`,
    iconURL: customer.user.displayAvatarURL(),
  });

  let isThief = customer.roles.cache.has(`${process.env.ROLE_ID_THIEF}`);
  let robCooldown = isThief
    ? Number(process.env.ROB_COOLDOWN_THIEF)
    : Number(process.env.ROB_COOLDOWN);

  let lastRobDate = Number(user.user!.lastRobDate);
  let canRob = (Date.now() - lastRobDate) / 1000 > robCooldown;

  if (item) {
    let itemId = item!.id;
    let insufficientFunds = user!.user!.cash < item!.buyPrice;
    if (insufficientFunds) {
      embed.setDescription(
        `❌ You do not have enough money to buy a **${item!.name}**!`
      );
      embed.setColor(`#${process.env.RED_COLOR}`);
      return embed;
    }

    if (item!.name.toLowerCase() == "refresher orb") {
      if (canRob) {
        embed.setDescription(
          `❌ You can only buy a **Refresher Orb** when \`rob\` is on cooldown!`
        );
        embed.setColor(`#${process.env.RED_COLOR}`);
        return embed;
      }

      await trpcNode.user.updateLastRobDate.mutate({
        id: userId,
        date: "0",
      });
    } else {
      let userInventory = await trpcNode.inventory.getByUserId.mutate({
        userId: userId,
      });
      let userHasItem = userInventory.inventory.some((e) => e.itemId == itemId);
      // If item is stackable
      if (item!.stackable) {
        if (!userHasItem) {
          // If user doesn't have item, add it to their inventory
          await trpcNode.inventory.create.mutate({
            userId: userId,
            itemId: itemId,
            amount: 1,
          });
        } else {
          // If user has item, increment amount
          await trpcNode.inventory.incrementUserItemAmount.mutate({
            userId: userId,
            itemId: itemId,
          });
        }
      } else {
        // If item is not stackable, and user doesn't have item, add it to their inventory
        if (!userHasItem) {
          await trpcNode.inventory.create.mutate({
            userId: userId,
            itemId: itemId,
            amount: 1,
          });
        } else {
          embed.setDescription(`❌ You already have a **${item!.name}**!`);
          embed.setColor(`#${process.env.RED_COLOR}`);
          return embed;
        }
      }
    }

    await trpcNode.user.subtractCash.mutate({
      id: userId,
      cash: item!.buyPrice,
    });

    await trpcNode.item.buyItem.mutate({
      id: itemId,
    });

    await trpcNode.guild.addToBank.mutate({
      id: customer.guild.id,
      amount: item!.buyPrice,
    });
    embed.setDescription(`✅ You bought a **${item!.name!}**!`);
    embed.setColor(`#${process.env.GREEN_COLOR}`);
  } else {
    embed.setDescription(`❌ Sorry, we don't sell **${itemName}** here.`);
    embed.setColor(`#${process.env.RED_COLOR}`);
  }

  return embed;
}

@ApplyOptions<CommandOptions>({
  name: "buy",
  description: "Buy an item from the shop.",
  preconditions: ["inBotChannel", "isNotInmate"],
})
export class BuyCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message, args: Args) {
    let argument = await args.rest("string");

    const embed = await buy(argument, message.member!);
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
