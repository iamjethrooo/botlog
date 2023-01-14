import type { Queue } from '../queue/Queue';
import type { AnyChannel, GuildMember } from 'discord.js';
export declare function manageStageChannel(voiceChannel: AnyChannel, botUser: GuildMember, instance: Queue): Promise<import("discord.js").Message<boolean> | undefined>;
