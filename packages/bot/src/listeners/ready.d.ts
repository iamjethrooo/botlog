import { Listener } from '@sapphire/framework';
import type { Client } from 'discord.js';
export declare class ReadyListener extends Listener {
    run(client: Client): void;
}
