import { ApplyOptions } from "@sapphire/decorators";
import { PaginatedFieldMessageEmbed } from "@sapphire/discord.js-utilities";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import {
  ChatInputCommandInteraction,
  GuildMember,
  Message,
  EmbedBuilder,
} from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "inventory",
  aliases: ["inv"],
  description: "Displays the items in your inventory.",
  preconditions: ["inBotChannel"],
})
export class InventoryCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    let userId = interaction.user.id;

    let userInventory = await trpcNode.inventory.getDisplayByUserId.query({
      userId: userId,
    });

    let inventoryFormatted: String[] = [];

    for (const i of userInventory.inventory) {
      inventoryFormatted.push(
        `${i.item.emoji} **${i.item.name} x ${i.amount}** \n`
      );
    }

    const baseEmbed = new EmbedBuilder()
      .setColor((<GuildMember>interaction.member)!.displayHexColor)
      .setAuthor({
        name: `${interaction.user.username}'s Inventory`,
        iconURL: interaction.user.displayAvatarURL(),
      });
    new PaginatedFieldMessageEmbed()
      .setTitleField(" ")
      .setTemplate(baseEmbed)
      .setItems(
        inventoryFormatted.length == 0
          ? ["Your inventory is empty! :("]
          : inventoryFormatted
      )
      .setItemsPerPage(10)
      .make()
      .run(interaction);
  }

  public override async messageRun(message: Message) {
    let userId = message.author.id;

    let userInventory = await trpcNode.inventory.getDisplayByUserId.query({
      userId: userId,
    });

    let inventoryFormatted: String[] = [];

    for (const i of userInventory.inventory) {
      inventoryFormatted.push(
        `${i.item.emoji} **${i.item.name} x ${i.amount}** \n`
      );
    }

    const baseEmbed = new EmbedBuilder()
      .setColor(message.member!.displayHexColor)
      .setAuthor({
        name: `${message.author.username}'s Inventory`,
        iconURL: message.author.displayAvatarURL(),
      });
    new PaginatedFieldMessageEmbed()
      .setTitleField(" ")
      .setTemplate(baseEmbed)
      .setItems(
        inventoryFormatted.length == 0
          ? ["Your inventory is empty! :("]
          : inventoryFormatted
      )
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
