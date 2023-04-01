import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import { CommandInteraction, MessageEmbed } from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "create-item",
  description: "Creates a new item.",
  preconditions: ["userIsAdmin"],
})
export class CreateItemCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    const itemName = interaction.options.getString("name", true);
    const itemDescription = interaction.options.getString("description", true);
    const emoji = interaction.options.getString("emoji", true);
    const price = interaction.options.getInteger("price", true);
    const stock = interaction.options.getInteger("stock", true);

    try {
      await trpcNode.item.create.mutate({
        name: itemName,
        emoji: emoji,
        description: itemDescription,
        buyPrice: price,
        stock: stock ? stock : 0,
      });

      const embed = new MessageEmbed()
        .setTitle("New item created!")
        .setDescription(
          `${emoji}**${itemName}**\n\nDescription: ${itemDescription}\n\nPrice: ${price}\n\nStock: ${stock}`
        )
        .setColor(`#${process.env.GREEN_COLOR}`);

      return await interaction.reply({ embeds: [embed] });
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
          type: "STRING",
          name: "name",
          description: "The name of the item.",
          required: true,
        },
        {
          type: "STRING",
          name: "description",
          description: "The item's description",
          required: true,
        },
        {
          type: "STRING",
          name: "emoji",
          description: "An emoji to use as the icon",
          required: true,
        },
        {
          type: "INTEGER",
          name: "price",
          description: "The price of the item.",
          required: true,
        },
        {
          type: "INTEGER",
          name: "stock",
          description: "The amount of stock available.",
          required: true,
        },
      ],
    });
  }
}
