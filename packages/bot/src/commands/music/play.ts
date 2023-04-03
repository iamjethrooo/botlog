import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import { container } from "@sapphire/framework";
import searchSong from "../../lib/utils/music/searchSong";
import type { Song } from "../../lib/utils/queue/Song";

@ApplyOptions<CommandOptions>({
  name: "play",
  description: "Play any song or playlist from YouTube, Spotify and more!",
  preconditions: [
    "GuildOnly",
    "isCommandDisabled",
    "inVoiceChannel",
    "inPlayerVoiceChannel",
  ],
})
export class PlayCommand extends Command {
  public override async chatInputRun(
    interaction: ChatInputCommandInteraction
  ): Promise<any> {

    await interaction.deferReply();

    const { client } = container;

    const query = interaction.options.getString("query", true);

    const { music } = client;

    // had a precondition make sure the user is infact in a voice channel
    const voiceChannel = interaction.guild?.voiceStates?.cache?.get(
      interaction.user.id
    )?.channel!;

    let queue = music.queues.get(interaction.guildId!);
    await queue.setTextChannelID(interaction.channel!.id);

    if (!queue.player) {
      const player = queue.createPlayer();
      await player.connect(voiceChannel.id, { deafened: true });
    }

    let tracks: Song[] = [];
    let message: string = "";

    const trackTuple = await searchSong(query, interaction.user);
    if (!trackTuple[1].length) {
      return await interaction.followUp({ content: trackTuple[0] as string }); // error
    }
    message = trackTuple[0];
    tracks.push(...trackTuple[1]);

    await queue.add(tracks);

    const current = await queue.getCurrentTrack();
    if (!current) {
      await queue.start();
    } else {
      client.emit(
        "musicSongPlayMessage",
        interaction.channel,
        await queue.getCurrentTrack()
      );
    }

    const track = await queue.getCurrentTrack();
    if (!track) return;
    return await interaction.followUp({ content: message });
  }

  public override registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): void {
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          name: "query",
          description: "What song or playlist would you like to listen to?",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    });
  }
}
