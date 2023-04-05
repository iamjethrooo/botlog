import { ApplyOptions } from "@sapphire/decorators";
import { PaginatedFieldMessageEmbed } from "@sapphire/discord.js-utilities";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
  container,
} from "@sapphire/framework";
import { ChatInputCommandInteraction, Message, EmbedBuilder } from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "shop",
  description: "View the shop.",
  preconditions: ["inBotChannel"],
})
export class ShopCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const { client } = container;
    try {
      let shop = await trpcNode.item.getAll.query();
      let shopFormatted: String[] = [];

      shop.allItems.forEach((item) => {
        shopFormatted.push(
          `${item.emoji} **${item.name}** | ${process.env.COIN_EMOJI}**\`${item.buyPrice}\`**\n${item.description}\n`
        );
      });

      const baseEmbed = new EmbedBuilder()
        .setColor(`#${process.env.GREEN_COLOR}`)
        .setAuthor({
          name: "Botlog Shop",
          iconURL: client.user!.displayAvatarURL(),
        });
      new PaginatedFieldMessageEmbed()
        .setTitleField(`Buy an item with the command \`buy <name>\``)
        .setTemplate(baseEmbed)
        .setItems(shopFormatted)
        .setItemsPerPage(5)
        .make()
        .run(interaction);
    } catch (error) {
      console.log(error);
    }
  }

  public override async messageRun(message: Message) {
    const { client } = container;
    try {
      let shop = await trpcNode.item.getAll.query();
      let shopFormatted: String[] = [];

      shop.allItems.forEach((item) => {
        shopFormatted.push(
          `${item.emoji} **${item.name}** | ${process.env.COIN_EMOJI}**\`${item.buyPrice}\`**\n${item.description}\n`
        );
      });

      const baseEmbed = new EmbedBuilder()
        .setColor(`#${process.env.GREEN_COLOR}`)
        .setAuthor({
          name: "Botlog Shop",
          iconURL: client.user!.displayAvatarURL(),
        });
      new PaginatedFieldMessageEmbed()
        .setTitleField(`Buy an item with the command \`buy <name>\``)
        .setTemplate(baseEmbed)
        .setItems(shopFormatted)
        .setItemsPerPage(5)
        .make()
        .run(message);
    } catch (error) {
      console.log(error);
    }
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
