import { Listener } from '@sapphire/framework';
import type { TextChannel } from 'discord.js';
import type { Song } from '../lib/utils/queue/Song';
export declare class MusicSongPlayMessageListener extends Listener {
    run(channel: TextChannel, track: Song): Promise<void>;
}
