import { ApplyOptions } from "@sapphire/decorators";
import { PaginatedFieldMessageEmbed } from "@sapphire/discord.js-utilities";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "shop",
  description: "View the shop.",
  preconditions: ["inBotChannel"],
})
export class ShopCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message) {
    let shop = await trpcNode.item.getAll.query();
    let shopFormatted: String[] = [];

    await message.guild!.members.fetch();

    shop.allItems.forEach((item) => {
      shopFormatted.push(
        `${item.emoji} **${item.name}** | ${process.env.COIN_EMOJI}**\`${item.buyPrice}\`**\n${item.description}\n`
      );
    });

    const baseEmbed = new MessageEmbed().setColor("#FF0000").setAuthor({
      name: message!.guild!.name,
      iconURL: message!.guild!.iconURL()!,
    });
    new PaginatedFieldMessageEmbed()
      .setTitleField("Shop")
      .setTemplate(baseEmbed)
      .setItems(shopFormatted)
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
