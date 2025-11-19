import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Args,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import {
  Message,
  EmbedBuilder,
  GuildMember,
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  TextChannel,
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
    name: `${customer.user.username}`,
    iconURL: customer.user.displayAvatarURL(),
  });

  const robCooldown = await trpcNode.setting.getByKey.mutate({
    key: "robCooldown",
  });
  const greenColor = await trpcNode.setting.getByKey.mutate({
    key: "greenColor",
  });
  const redColor = await trpcNode.setting.getByKey.mutate({
    key: "redColor",
  });
  const bodyguardDuration = Number(
    await trpcNode.setting.getByKey.mutate({
      key: "bodyguardDuration",
    })
  );
  const coinEmoji = await trpcNode.setting.getByKey.mutate({
    key: "coinEmoji",
  });

  let lastRobDate = Number(user.user!.lastRobDate);
  let canRob = (Date.now() - lastRobDate) / 1000 > Number(robCooldown);
  const hasBodyguard =
    Number(user.user?.lastBodyguardDate) + Math.round(bodyguardDuration * 1000) >
    Date.now();
  console.log(user.user?.lastBodyguardDate)
  const canBuyBodyguard =
      Number(user.user?.lastBodyguardDate) + Math.round(432000 * 1000) < // 5 days
    Date.now();

  if (item) {
    let itemId = item!.id;
    let buyPrice = item!.buyPrice;
    if (item!.percentage) {
      buyPrice = Math.round(user!.user!.cash * (item!.buyPrice / 100))
    }
    let insufficientFunds = user!.user!.cash < buyPrice;
    if (insufficientFunds) {
      embed.setDescription(
        `❌ You do not have enough money to buy a **${item!.name}**!`
      );
      embed.setColor(`#${redColor}`);
      return embed;
    }

    if (item!.name.toLowerCase() == "refresher orb") {
      if (canRob) {
        embed.setDescription(
          `❌ You can only buy a **Refresher Orb** when \`rob\` is on cooldown!`
        );
        embed.setColor(`#${redColor}`);
        return embed;
      }

      await trpcNode.user.updateLastRobDate.mutate({
        id: userId,
        date: "0",
      });
    } else if (item!.name.toLowerCase() == "bodyguard") {
      if (hasBodyguard) {
        embed.setDescription(`❌ You already have a \`Bodyguard\`!`);
        embed.setColor(`#${redColor}`);
        return embed;
      }
      if (!canBuyBodyguard) {
        console.log(`Last bodyguard: ${Math.round(Number(user.user?.lastBodyguardDate) * 1000) + 43200}`);
        embed.setDescription(`❌ You can only hire a \`Bodyguard\` every 5 days. Come back <t:${Math.round(Number(user.user?.lastBodyguardDate) / 1000) + 432000}:R>`); // 432000 = 5 days
        embed.setColor(`#${redColor}`);
        return embed;
      }
      await trpcNode.user.updateLastBodyguardDate.mutate({
        id: userId,
        date: String(Date.now()),
      });
    }
    // If item is supposed to give a role when purchased
    else if (item.roleGiven) {
      let roleId = item.roleGiven;
      let roleGiven = customer.guild!.roles.cache.find(
        (role) => role.id == roleId
      );

      // If the role exists
      if (roleGiven) {
        const customerHasRole = customer.roles.cache.has(roleId);
        if (customerHasRole) {
          embed.setDescription(`❌ You already have a **${item!.name}**!`);
          embed.setColor(`#${redColor}`);
          return embed;
        } else {
          customer.roles.add(roleGiven);
        }
      }
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
          embed.setColor(`#${redColor}`);
          return embed;
        }
      }
    }

    await trpcNode.user.subtractCash.mutate({
      id: userId,
      cash: buyPrice,
    });

    await trpcNode.item.buyItem.mutate({
      id: itemId,
    });

    await trpcNode.guild.addToBank.mutate({
      id: customer.guild.id,
      amount: buyPrice,
    });
    embed.setDescription(`✅ You bought a **${item!.name!}**${item!.name.toLowerCase() == 'bodyguard' ? ` for **${coinEmoji}${buyPrice}**` : ''}!`);
    embed.setColor(`#${greenColor}`);
  } else {
    embed.setDescription(`❌ Sorry, we don't sell **${itemName}** here.`);
    embed.setColor(`#${redColor}`);
  }

  return embed;
}

@ApplyOptions<CommandOptions>({
  name: "buy",
  description: "Buy an item from the shop.",
  preconditions: ["inBotChannel", "isNotInmate"],
})
export class BuyCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const itemName = interaction.options.getString("item", true);

    const embed = await buy(itemName, (<GuildMember>interaction.member)!);

    return await interaction.reply({ embeds: [embed] });
  }

  public override async messageRun(message: Message, args: Args) {
    let argument = await args.rest("string");

    const embed = await buy(argument, message.member!);
    return await (message.channel as TextChannel).send({ embeds: [embed] });
  }

  public override async autocompleteRun(interaction: AutocompleteInteraction) {
    const itemName = interaction.options.getString("item", true).toLowerCase();

    const items = await trpcNode.item.getAll.query();
    const matchingItems = items.allItems.filter((item) =>
      item.name.toLowerCase().startsWith(itemName)
    );

    const options = matchingItems.map((item) => ({
      name: item.name,
      value: item.name,
    }));

    return interaction.respond([options[0]]);
  }

  public override registerApplicationCommands(
    registery: ApplicationCommandRegistry
  ): void {
    registery.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          type: ApplicationCommandOptionType.String,
          required: true,
          name: "item",
          description: "What item do you want to buy?",
          autocomplete: true,
        },
      ],
    });
  }
}
