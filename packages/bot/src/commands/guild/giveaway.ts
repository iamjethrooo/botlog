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
      Ends at: <t:${Math.round(Number(endsAt)/1000)}:F>
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
    if (attachment == null) {
      await interaction.reply({
        content: "🎉Giveaway🎉",
        embeds: [invite],
        components: [buttons],
      });
    } else {
      await interaction.reply({
        content: "🎉Giveaway🎉",
        embeds: [invite],
        components: [buttons],
        files: [{ attachment: attachment.url }],
      });
    }

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
