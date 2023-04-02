import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Args,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "buy",
  description: "Buy an item from the shop.",
  preconditions: ["inBotChannel", "isNotInmate"],
})
export class BuyCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message, args: Args) {
    let itemName = await args.rest("string");
    let userId = message.author.id;
    let shop = await trpcNode.item.getAll.query();
    let user = await trpcNode.user.getUserById.query({
      id: userId,
    });
    let item;

    shop.allItems.forEach((i) => {
      if (i.name.toLowerCase() == itemName.toLowerCase()) {
        item = i;
      }
    });

    const embed = new MessageEmbed().setAuthor(
      `${message.author.username}#${message.author.discriminator}`,
      message.author.displayAvatarURL({ dynamic: true })
    );
    console.log(item);

    let isThief = message.member!.roles.cache.has(
      `${process.env.ROLE_ID_THIEF}`
    );
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
        return await message.channel.send({ embeds: [embed] });
      }

      if (item!.name.toLowerCase() == "refresher orb") {
        if (canRob) {
          embed.setDescription(
            `❌ You can only buy a **Refresher Orb** when \`rob\` is on cooldown!`
          );
          embed.setColor(`#${process.env.RED_COLOR}`);
          return await message.channel.send({ embeds: [embed] });
        }

        await trpcNode.user.updateLastRobDate.mutate({
          id: userId,
          date: "0",
        });
      } else {
        let userInventory = await trpcNode.inventory.getByUserId.mutate({
          userId: userId,
        });
        let userHasItem = userInventory.inventory.some(
          (e) => e.itemId == itemId
        );

        if (item!.name.toLowerCase() == "luck potion") {
          if (!userHasItem) {
            await trpcNode.inventory.create.mutate({
              userId: userId,
              itemId: itemId,
              amount: 1,
            });
            // await trpcNode.inventory.incrementUserItemAmount.mutate({
            //   userId: userId,
            //   itemId: itemId,
            // });
          } else {
            embed.setDescription(`❌ You already have a **${item!.name}**!`);
            embed.setColor(`#${process.env.RED_COLOR}`);
            return await message.channel.send({ embeds: [embed] });
          }
        }
        // If item is stackable
        else {
          if (!userHasItem) {
            await trpcNode.inventory.create.mutate({
              userId: userId,
              itemId: itemId,
              amount: 1,
            });
          } else {
            await trpcNode.inventory.incrementUserItemAmount.mutate({
              userId: userId,
              itemId: itemId,
            });
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
        id: message!.guildId!,
        amount: item!.buyPrice,
      });
      embed.setDescription(`✅ You bought a **${item!.name!}**!`);
      embed.setColor(`#${process.env.GREEN_COLOR}`);
    } else {
      embed.setDescription(`❌ Sorry, we don't sell **${itemName}** here.`);
      embed.setColor(`#${process.env.RED_COLOR}`);
    }

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
