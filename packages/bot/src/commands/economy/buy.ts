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
})
export class BuyCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message, args: Args) {
    let itemName = await args.rest("string");
    let shop = await trpcNode.item.getAll.query();
    let user = await trpcNode.user.getUserById.query({
      id: message.author.id,
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
          id: message.author.id,
          date: "0",
        });
      }

      await trpcNode.user.subtractCash.mutate({
        id: message.author.id,
        cash: item!.buyPrice,
      });

      await trpcNode.item.buyItem.mutate({
        id: item!.id,
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
