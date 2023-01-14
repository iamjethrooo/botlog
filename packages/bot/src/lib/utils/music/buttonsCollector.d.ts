import type { Message, MessageComponentInteraction } from 'discord.js';
import type { Queue } from '../queue/Queue';
import type { Song } from '../queue/Song';
export default function buttonsCollector(message: Message, song: Song): Promise<import("discord.js").InteractionCollector<MessageComponentInteraction<import("discord.js").CacheType>> | undefined>;
export declare function deletePlayerEmbed(queue: Queue): Promise<void>;
