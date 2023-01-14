import { MessageEmbed } from 'discord.js';
import type { Song } from '../queue/Song';
type PositionType = number | undefined;
export declare class NowPlayingEmbed {
    track: Song;
    position: PositionType;
    length: number;
    volume: number;
    queue?: Song[];
    last?: Song;
    paused?: Boolean;
    constructor(track: Song, position: PositionType, length: number, volume: number, queue?: Song[], last?: Song, paused?: Boolean);
    NowPlayingEmbed(): Promise<MessageEmbed>;
    private timeString;
    private millisecondsToTimeObject;
}
export {};
