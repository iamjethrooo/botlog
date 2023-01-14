import { Listener } from '@sapphire/framework';
import type { GuildMember } from 'discord.js';
export declare class GuildMemberListener extends Listener {
    run(member: GuildMember): Promise<void>;
}
