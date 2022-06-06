import { NowPlayingEmbed } from './../../lib/utils/music/NowPlayingEmbed';
import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions
} from '@sapphire/framework';
import type { CommandInteraction } from 'discord.js';
import { container } from '@sapphire/framework';
import type { Song } from '../../lib/utils/queue/Song';
import { embedButtons } from '../../lib/utils/music/ButtonHandler';

@ApplyOptions<CommandOptions>({
  name: 'shuffle',
  description: 'Shuffle the music queue',
  preconditions: [
    'GuildOnly',
    'inVoiceChannel',
    'playerIsPlaying',
    'inPlayerVoiceChannel'
  ]
})
export class LeaveCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    const { client } = container;

    const player = client.music.players.get(interaction.guild!.id);

    if (!player?.queue.tracks.length) {
      return await interaction.reply(':x: There are no songs in queue!');
    }

    shuffleQueue(player?.queue.tracks as Song[]);

    const NowPlaying = new NowPlayingEmbed(
      player?.queue.current!,
      player?.accuratePosition,
      player?.queue.current?.length as number,
      player?.volume!,
      player?.queue.tracks!,
      player?.queue.last!,
      player?.paused
    );

    await embedButtons(
      NowPlaying.NowPlayingEmbed(),
      player?.queue!,
      player?.queue.current!
    );

    return await interaction.reply('Queue shuffled');
  }

  public override registerApplicationCommands(
    registery: ApplicationCommandRegistry
  ): void {
    registery.registerChatInputCommand({
      name: this.name,
      description: this.description
    });
  }
}

// temp method until the shuffle method gets fixed in the lavaclient queue plugin
function shuffleQueue(queue: Song[]) {
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
}