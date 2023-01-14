import type { Song } from '../lib/utils/queue/Song';
import { Listener } from '@sapphire/framework';
import type { CommandInteraction } from 'discord.js';
export declare class MusicSongSkipNotifyListener extends Listener {
    run(interaction: CommandInteraction, track: Song): Promise<void>;
}
