import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Args,
  Command,
  CommandOptions,
  container,
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
  const { client } = container;
  const userId = customer.id;
  const embed = new EmbedBuilder().setAuthor({
    name: customer.user.username,
    iconURL: customer.user.displayAvatarURL(),
  });
  const redColor = await trpcNode.setting.getByKey.mutate({ key: "redColor" });
  const fail = (message: string) => embed.setDescription(`❌ ${message}`).setColor(`#${redColor}`);
  if (client.intervals["holdup"] && client.holdupVictim === userId) {
    return fail("You cannot make purchases while a holdup targeting you is in progress!");
  }
  const shop = await trpcNode.item.getAll.query();
  const number = Number(itemName);
  const item = Number.isNaN(number)
    ? shop.allItems.find(i => i.name.toLowerCase() === itemName.toLowerCase())
    : shop.allItems[number - 1];
  if (!item) return fail(`Sorry, we don't sell **${itemName}** here.`);
  const greenColor = await trpcNode.setting.getByKey.mutate({ key: "greenColor" });
  const coinEmoji = await trpcNode.setting.getByKey.mutate({ key: "coinEmoji" });
  const special = ["bodyguard", "refresher orb"].includes(item.name.toLowerCase());
  try {
    if (item.roleGiven && !special) {
      const role = await customer.guild.roles.fetch(item.roleGiven);
      if (!role) return fail("The shop role is unavailable. No new charge was made.");
      const member = await customer.guild.members.fetch({ user: userId, force: true });
      if (member.roles.cache.has(item.roleGiven)) return fail(`You already have a **${item.name}**!`);
    }
    const purchase = await trpcNode.item.purchase.mutate({
      userId, guildId: customer.guild.id, itemId: item.id, roleGiven: item.roleGiven,
    });
    if (purchase.roleGiven) {
      try {
        // Single-role add uses Discord's idempotent PUT endpoint. The persisted
        // entitlement lets a repeated buy recover without another DB charge.
        await customer.roles.add(purchase.roleGiven);
      } catch (error) {
        console.error("Paid shop role delivery failed", error);
        return fail(`Your purchase of **${item.name}** is paid, but the role could not be confirmed. Retry this buy command to deliver the role without another charge. If it keeps failing, contact an admin.`);
      }
    }
    return embed.setDescription(`✅ You bought a **${purchase.item.name}**${purchase.item.name.toLowerCase() === "bodyguard" ? ` for **${coinEmoji}${purchase.buyPrice}**` : ""}!`)
      .setColor(`#${greenColor}`);
  } catch (error) {
    const failure = error as { data?: { code?: string }; message?: string };
    if (failure.data?.code === "BAD_REQUEST") return fail(failure.message!);
    console.error("Shop purchase could not be confirmed", error);
    return fail("The purchase could not be confirmed. Check your balance and inventory before trying again. Paid role deliveries can be retried without another charge.");
  }
}

@ApplyOptions<CommandOptions>({
  name: "buy",
  description: "Buy an item from the shop.",
  preconditions: ["inBotChannel", "isNotInmate"],
})
export class BuyCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const itemName = interaction.options.getString("item", true);

    const embed = await buy(itemName, (<GuildMember>interaction.member)!);

    return await interaction.editReply({ embeds: [embed] });
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
