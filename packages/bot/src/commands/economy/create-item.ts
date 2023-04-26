import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "create-item",
  description: "Creates a new item.",
  preconditions: ["userIsAdmin"],
})
export class CreateItemCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const itemName = interaction.options.getString("name", true);
    const itemDescription = interaction.options.getString("description", true);
    const emoji = interaction.options.getString("emoji", true);
    const price = interaction.options.getInteger("price", true);
    const stock = interaction.options.getInteger("stock", true);
    const stackable = interaction.options.getBoolean("stackable", true);
    const consumable = interaction.options.getBoolean("consumable", true);
    const roleGiven = interaction.options.getRole("role-given");
    console.log(roleGiven);
    try {
      await trpcNode.item.create.mutate({
        name: itemName,
        emoji: emoji,
        description: itemDescription,
        buyPrice: price,
        stock: stock ? stock : 0,
        stackable,
        consumable,
        roleGiven: roleGiven == null ? "" : roleGiven.id
      });

      const embed = new EmbedBuilder()
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
          type: ApplicationCommandOptionType.String,
          name: "name",
          description: "The name of the item.",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "description",
          description: "The item's description",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "emoji",
          description: "An emoji to use as the icon",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.Integer,
          name: "price",
          description: "The price of the item.",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.Integer,
          name: "stock",
          description: "The amount of stock available.",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.Boolean,
          name: "stackable",
          description: "Whether the item is stackable or not.",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.Boolean,
          name: "consumable",
          description: "Whether the item is consumable or not.",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.Role,
          name: "role-given",
          description: "The role given when the item is purchased.",
        },
      ],
    });
  }
}
