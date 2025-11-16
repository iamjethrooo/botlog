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

async function generateShopText() {
  let counter = 1;
  let shop = await trpcNode.item.getAll.query();
  let shopFormatted: String[] = [];
  const coinEmoji = await trpcNode.setting.getByKey.mutate({
    key: "coinEmoji",
  });
  shop.allItems.forEach((item) => {
    shopFormatted.push(
      `**${counter}.** ${item.emoji} **${item.name}** | ${item.name == 'Bodyguard' ? '' : coinEmoji}**\`${item.name == 'Bodyguard' ? `${item.buyPrice}% of cash` : item.buyPrice}\`**\n${item.description}\n`
    );
    counter++;
  });

  return shopFormatted;
}

@ApplyOptions<CommandOptions>({
  name: "shop",
  description: "View the shop.",
  preconditions: ["inBotChannel"],
})
export class ShopCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const { client } = container;
    const greenColor = await trpcNode.setting.getByKey.mutate({
      key: "greenColor",
    });
    try {
      let shopFormatted = await generateShopText();

      const baseEmbed = new EmbedBuilder()
        .setColor(`#${greenColor}`)
        .setAuthor({
          name: "Botlog Shop",
          iconURL: client.user!.displayAvatarURL(),
        });
      new PaginatedFieldMessageEmbed()
        .setTitleField(`Buy an item with the command \`buy <name>/<number>\``)
        .setTemplate(baseEmbed)
        .setItems(shopFormatted)
        .setItemsPerPage(4)
        .make()
        .run(interaction);
    } catch (error) {
      console.log(error);
    }
  }

  public override async messageRun(message: Message) {
    const { client } = container;
    const greenColor = await trpcNode.setting.getByKey.mutate({
      key: "greenColor",
    });
    try {
      let shopFormatted = await generateShopText();

      const baseEmbed = new EmbedBuilder()
        .setColor(`#${greenColor}`)
        .setAuthor({
          name: "Botlog Shop",
          iconURL: client.user!.displayAvatarURL(),
        });
      new PaginatedFieldMessageEmbed()
        .setTitleField(`Buy an item with the command \`buy <name>/<number>\``)
        .setTemplate(baseEmbed)
        .setItems(shopFormatted)
        .setItemsPerPage(4)
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
