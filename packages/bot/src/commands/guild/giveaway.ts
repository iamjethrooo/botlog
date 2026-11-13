import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
  container,
} from "@sapphire/framework";
import {
  GuildMember,
  EmbedBuilder,
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { trpcNode } from "../../trpc";

export const participants: Map<string, GuildMember> = new Map();
@ApplyOptions<CommandOptions>({
  name: "giveaway",
  description: "Start a giveaway",
  // preconditions: ["isCommandDisabled"],
})
export class GiveawayCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const { client } = container;
    const prize = interaction.options.getString("prize", true);
    const endsAt = interaction.options.getString("ends-at", true);

    let entryFee = interaction.options.getInteger("entry-fee");
    entryFee = entryFee == null ? 0 : entryFee;
    let winners = interaction.options.getInteger("winners");
    winners = winners == null ? 1 : winners;
    let entries = interaction.options.getInteger("entries");
    entries = entries == null ? 1 : entries;
    const host = interaction.options.getUser("host");
    let attachment = interaction.options.getAttachment("attachment");

    if (!prize.trim() || prize.length > 256 || !Number.isSafeInteger(entryFee) || entryFee < 0 || entryFee > 2147483647 ||
        !Number.isSafeInteger(winners) || winners < 1 || winners > 100 ||
        !Number.isSafeInteger(entries) || entries < 1 || entries > 2147483647 ||
        !endsAt.trim() || !Number.isSafeInteger(Number(endsAt)) || Number(endsAt) <= Date.now() || Number(endsAt) > 8640000000000000) {
      await interaction.reply({ content: ":x: Use a valid future end time, nonnegative entry fee, positive entry count, and 1–100 winners.", ephemeral: true });
      return;
    }
    if (interaction.channelId !== process.env.GIVEAWAY_CHANNEL_ID) {
      await interaction.reply({ content: ":x: Start the giveaway in the configured giveaway channel.", ephemeral: true });
      return;
    }
    await interaction.deferReply();
    try {
      const coinEmoji = await trpcNode.setting.getByKey.mutate({
        key: "coinEmoji",
      });
      const invite = new EmbedBuilder()
        .setTitle(`${prize}`)
        .setColor((<GuildMember>interaction.member)!.displayHexColor)
        .setDescription(
          `Click the button to join!\n
        Entry Fee: ${coinEmoji}${entryFee}
        Number of Entries: ${entries}
        Number of Winners: ${winners}
        Ends at: <t:${Math.round(Number(endsAt) / 1000)}:F>
        ${host == null ? "" : `Hosted by: <@${host.id}>`}
        `
        )
        .setTimestamp();

      const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`${interaction.id}-Join`)
          .setLabel("Join")
          .setEmoji("🎉")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`${interaction.id}-Participants`)
          .setLabel("Participants")
          .setEmoji("👥")
          .setStyle(ButtonStyle.Secondary)
      );
      // Obtain the message identity without exposing a payable button before the
      // database record exists. A failed publish leaves a recoverable active row.
      await interaction.editReply({ content: "Creating giveaway…" });
      let message = await interaction.fetchReply();
      await trpcNode.giveaway.create.mutate({
        messageId: message.id,
        giveawayId: interaction.id,
        hostId: host == null ? "" : host.id,
        entryFee: entryFee.toString(),
        prize,
        numOfWinners: winners,
        numOfEntries: entries,
        endsAt: endsAt.toString(),
        dateStarted: Math.round(Date.now() / 1000).toString(),
      });

      client.activeGiveaways.set(interaction.id, Number(endsAt));
      if (attachment == null) {
        await interaction.editReply({
          content: "🎉Giveaway🎉",
          embeds: [invite],
          components: [buttons],
        });
      } else {
        await interaction.editReply({
          content: "🎉Giveaway🎉",
          embeds: [invite],
          components: [buttons],
          files: [{ attachment: attachment.url }],
        });
      }

    } catch (error) {
      console.error("Giveaway creation failed", error);
      await interaction.editReply({ content: ":x: Could not publish the giveaway. Check its recorded state before creating another.", components: [] });
    }
    return;
  }

  public override registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): void {
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          type: ApplicationCommandOptionType.String,
          required: true,
          name: "prize",
          description: "What is the prize?",
        },
        {
          type: ApplicationCommandOptionType.String,
          required: true,
          name: "ends-at",
          description:
            "When will the giveaway end? (in milliseconds since Unix Epoch)",
        },
        {
          type: ApplicationCommandOptionType.Integer,
          name: "entry-fee",
          description: "How much is the entry fee?",
        },
        {
          type: ApplicationCommandOptionType.Integer,
          name: "winners",
          description: "How many winners?",
        },
        {
          type: ApplicationCommandOptionType.Integer,
          name: "entries",
          description: "How many entries can a user have?",
        },
        {
          type: ApplicationCommandOptionType.User,
          name: "host",
          description: "Who hosted this giveaway?",
        },
        {
          type: ApplicationCommandOptionType.Attachment,
          name: "attachment",
          description: "Attachment for the giveaway",
        },
      ],
    });
  }
}
