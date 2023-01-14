import { Listener } from '@sapphire/framework';
import type { TextChannel } from 'discord.js';
export declare class MusicFinishNotifyListener extends Listener {
    run(channel: TextChannel): Promise<void>;
}
