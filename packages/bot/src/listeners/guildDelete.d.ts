import { Listener } from '@sapphire/framework';
import type { Guild } from 'discord.js';
export declare class GuildDeleteListener extends Listener {
    run(guild: Guild): Promise<void>;
}
