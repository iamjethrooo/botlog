import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import {
  Message,
  EmbedBuilder,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  User,
  TextChannel,
} from "discord.js";
import { trpcNode } from "../../trpc";

async function rob(user: User, victimId: string, guildId: string, eventId: string) {
  const rows = await trpcNode.setting.getByKeys.query({ keys: ["coinEmoji", "greenColor", "redColor"] });
  const settings = Object.fromEntries(rows.map(row => [row.settingKey, row.settingValue]));
  const result = await trpcNode.robLog.resolveRobbery.mutate({ robberId: user.id, victimId, guildId, eventId });
  const embed = new EmbedBuilder().setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
    .setColor(`#${settings.redColor}`);

  switch (result.status) {
    case "self":
      return embed.setDescription("❌ You cannot rob yourself!");
    case "missing":
      return embed.setDescription("❌ Both users need an economy account.");
    case "cooldown":
      return embed.setDescription(`⏲️ Too soon. You can attempt to rob another member <t:${Math.round(result.retryAt / 1000)}:R>`);
    case "same_victim":
      return embed.setDescription("❌ You cannot rob the same user in a row!");
    case "protected":
      return embed.setDescription(`❌ <@${victimId}> was robbed recently. Try again <t:${Math.floor(result.retryAt / 1000)}:R>`);
    case "resolved": {
      const amount = `${settings.coinEmoji}${result.amount}`;
      let description = result.success
        ? `✅ You robbed ${amount} from <@${victimId}>.`
        : `❌ You were caught attempting to rob <@${victimId}> and have been fined ${amount}.`;
      if (result.consumedItems.length) {
        const verb = result.consumedItems.length === 1 ? "was" : "were";
        description += `\n\nYour ${result.consumedItems.join(" and ")} ${verb} consumed during the robbery.`;
      }
      if (result.success) embed.setColor(`#${settings.greenColor}`);
      return embed.setDescription(description);
    }
  }
}
@ApplyOptions<CommandOptions>({
  name: "rob",
  description: "Rob another user.",
  preconditions: ["inBotChannel", "isNotInmate"],
})
export class RobCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user", true);

    let victimId = user.id;

    try {
      await interaction.deferReply();
      let resultEmbed = await rob(
        interaction.user,
        victimId,
        interaction.guildId!,
        interaction.id
      );
      return await interaction.editReply({ embeds: [resultEmbed] });
    } catch (error) {
      console.log(error);
      return;
    }
  }

  public override async messageRun(message: Message) {
    let hasNoMention = message.mentions.users.size < 1;
    if (hasNoMention) return;

    let victimId = message.mentions.users!.first()!.id;

    try {
      let resultEmbed = await rob(
        message.author,
        victimId,
        message.guildId!,
        message.id
      );
      return await (message.channel as TextChannel).send({ embeds: [resultEmbed] });
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
          type: ApplicationCommandOptionType.User,
          required: true,
          name: "user",
          description: `Who do you want to rob?`,
        },
      ],
    });
  }
}
