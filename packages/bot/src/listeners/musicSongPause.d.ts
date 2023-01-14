import { Listener } from '@sapphire/framework';
import type { CommandInteraction } from 'discord.js';
export declare class MusicSongPauseListener extends Listener {
    run(interaction: CommandInteraction): Promise<void>;
}
