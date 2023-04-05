import {
  CommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  GuildMember,
  ButtonStyle,
} from "discord.js";

export class GameInvite {
  title: string;
  players: GuildMember[];
  interaction: CommandInteraction;
  bet: Number;

  public constructor(
    title: string,
    players: GuildMember[],
    interaction: CommandInteraction,
    bet: Number
  ) {
    this.title = title;
    this.players = players;
    this.interaction = interaction;
    this.bet = bet;
  }

  public gameInviteEmbed(): EmbedBuilder {
    let thumbnail: string = "";
    switch (this.title) {
      default:
        thumbnail =
          "https://cdn.discordapp.com/attachments/677886889994223627/1068495128387407893/bbc_coin.png";
        break;
    }

    const gameInvite = new EmbedBuilder()
      .setAuthor({
        name: this.interaction.user.username,
        iconURL: this.interaction.user.avatar
          ? this.interaction.user.displayAvatarURL()
          : this.interaction.user.defaultAvatarURL,
      })
      .setTitle(`${this.title} - Game Invitation`)
      .setColor((<GuildMember>this.interaction.member)!.displayHexColor)
      .setThumbnail(thumbnail)
      .setDescription(
        `${this.interaction.user} would like to play a game of ${this.title}. Click Join if you want to join.`
      )
      .addFields({
        name: "Bet",
        value: `${process.env.COIN_EMOJI}${this.bet}`,
        inline: true,
      })
      .setFooter({ text: "Invite will expire in 60 seconds" })
      .setTimestamp();
    return gameInvite;
  }
  public gameInviteButtons(): ActionRowBuilder<ButtonBuilder> {
    const gameInviteButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`${this.interaction.id}${this.players.at(0)?.id}-Join`)
        .setLabel("Join")
        .setStyle(ButtonStyle.Primary)
    );
    return gameInviteButtons;
  }
}
