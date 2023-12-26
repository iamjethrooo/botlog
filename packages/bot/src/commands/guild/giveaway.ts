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
    const sponsor = <GuildMember>interaction.member;
    let entryFee = interaction.options.getInteger("entry-fee");
    entryFee = entryFee == null ? 0 : entryFee;
    const prize = interaction.options.getString("prize", true);
    let winners = interaction.options.getInteger("winners", true);
    winners = winners == null ? 0 : winners;
    const duration = interaction.options.getInteger("duration", true);
    let entries = interaction.options.getInteger("entries", true);
    entries = entries == null ? 0 : entries;
    // let attachment = interaction.options.getAttachment("attachment");

    if (entryFee < 0) {
      return await interaction.reply({
        content: ":x: Entry fee must not be less than 0!",
        ephemeral: true,
      });
    }

    const invite = new EmbedBuilder()
      .setTitle(`${prize}`)
      .setColor((<GuildMember>interaction.member)!.displayHexColor)
      .setDescription(
        `Click the button to join!\n
      Entry Fee: ${process.env.COIN_EMOJI}${entryFee}
      Number of Entries: ${entries}
      Number of Winners: ${winners}
      Ends at: <t:${Math.round(Date.now() / 1000) + duration}:F>
      Hosted by: <@${sponsor.id}>
      `
      )
      .setTimestamp();

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`${interaction.id}-Join`)
        .setLabel("Join")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`${interaction.id}-Participants`)
        .setLabel("Participants")
        .setStyle(ButtonStyle.Secondary)
    );
    await interaction.reply({
      content: "🎉Giveaway🎉",
      embeds: [invite],
      components: [buttons],
    });
    let message = await interaction.fetchReply();
    await trpcNode.giveaway.create.mutate({
      messageId: message.id,
      giveawayId: interaction.id,
      hostId: sponsor.id,
      entryFee: entryFee.toString(),
      prize,
      numOfWinners: winners,
      numOfEntries: entries,
      duration: duration.toString(),
      dateStarted: Math.round(Date.now() / 1000).toString(),
    });

    client.activeGiveaways = (await trpcNode.giveaway.getActive.query()).map(
      (giveaway) => {
        return giveaway.giveawayId;
      }
    );
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
          required: true,
          name: "duration",
          description: "How long is the duration in seconds?",
        },
        {
          type: ApplicationCommandOptionType.Integer,
          name: "entries",
          description: "How many entries can a user have?",
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
