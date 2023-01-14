import { Listener } from '@sapphire/framework';
import type { Guild } from 'discord.js';
export declare class GuildCreateListener extends Listener {
    run(guild: Guild): Promise<void>;
}
