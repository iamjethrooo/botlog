import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';
export declare class MessageUpdateListener extends Listener {
    run(message: Message): Promise<void>;
}
