import type { Song } from '../queue/Song';
import type { Queue } from '../queue/Queue';
import { MessageEmbed } from 'discord.js';
export declare function embedButtons(embed: MessageEmbed, queue: Queue, song: Song, message?: string): Promise<void>;
