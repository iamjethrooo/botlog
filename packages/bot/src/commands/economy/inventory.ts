import { ApplyOptions } from "@sapphire/decorators";
import { PaginatedFieldMessageEmbed } from "@sapphire/discord.js-utilities";
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
  name: "inventory",
  aliases: ["inv"],
  description: "Displays the items in your inventory.",
  preconditions: ["inBotChannel"],
})
export class InventoryCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    let userId = interaction.user.id;

    let userInventory = await trpcNode.inventory.getByUserId.mutate({
      userId: userId,
    });

    let inventoryFormatted: String[] = [];

    for (const i of userInventory.inventory) {
      let item = await trpcNode.item.getItemById.query({ id: i.itemId });

      inventoryFormatted.push(
        `${item.item!.emoji} **${item.item!.name} x ${i.amount}** \n`
      );
    }

    const baseEmbed = new MessageEmbed()
      .setColor((<GuildMember>interaction.member)!.displayHexColor)
      .setAuthor({
        name: `${interaction.user.username}'s Inventory`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });
    new PaginatedFieldMessageEmbed()
      .setTitleField(" ")
      .setTemplate(baseEmbed)
      .setItems(inventoryFormatted)
      .setItemsPerPage(10)
      .make()
      .run(interaction);
  }

  public override async messageRun(message: Message) {
    let userId = message.author.id;

    let userInventory = await trpcNode.inventory.getByUserId.mutate({
      userId: userId,
    });

    let inventoryFormatted: String[] = [];

    for (const i of userInventory.inventory) {
      let item = await trpcNode.item.getItemById.query({ id: i.itemId });

      inventoryFormatted.push(
        `${item.item!.emoji} **${item.item!.name} x ${i.amount}** \n`
      );
    }

    const baseEmbed = new MessageEmbed()
      .setColor(message.member!.displayHexColor)
      .setAuthor({
        name: `${message.author.username}'s Inventory`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      });
    new PaginatedFieldMessageEmbed()
      .setTitleField(" ")
      .setTemplate(baseEmbed)
      .setItems(inventoryFormatted)
      .setItemsPerPage(10)
      .make()
      .run(message);
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
