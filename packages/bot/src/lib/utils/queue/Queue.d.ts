import type { CommandInteraction, Guild, GuildMember, TextChannel, VoiceChannel } from 'discord.js';
import type { Song } from './Song';
import type { Track } from '@lavaclient/types/v3';
import type { DiscordResource, Player, Snowflake } from 'lavaclient';
import type { QueueStore } from './QueueStore';
export declare enum LoopType {
    None = 0,
    Queue = 1,
    Song = 2
}
export interface QueueEvents {
    trackStart: (song: Song) => void;
    trackEnd: (song: Song) => void;
    finish: () => void;
}
export interface Loop {
    type: LoopType;
    current: number;
    max: number;
}
export interface AddOptions {
    requester?: Snowflake | DiscordResource;
    userInfo?: GuildMember;
    added?: number;
    next?: boolean;
}
export type Addable = string | Track | Song;
interface NowPlaying {
    song: Song;
    position: number;
}
interface QueueKeys {
    readonly next: string;
    readonly position: string;
    readonly current: string;
    readonly skips: string;
    readonly systemPause: string;
    readonly replay: string;
    readonly volume: string;
    readonly text: string;
    readonly embed: string;
}
export declare class Queue {
    readonly store: QueueStore;
    readonly guildID: string;
    readonly keys: QueueKeys;
    private skipped;
    constructor(store: QueueStore, guildID: string);
    get client(): import("@sapphire/framework").SapphireClient<boolean>;
    get player(): Player;
    get playing(): boolean;
    get paused(): boolean;
    get guild(): Guild;
    get voiceChannel(): VoiceChannel | null;
    get voiceChannelID(): string | null;
    createPlayer(): Player;
    destroyPlayer(): void;
    start(replaying?: boolean): Promise<boolean>;
    canStart(): Promise<boolean>;
    add(songs: Song | Array<Song>, options?: AddOptions): Promise<number>;
    pause(interaction?: CommandInteraction): Promise<void>;
    resume(interaction?: CommandInteraction): Promise<void>;
    getSystemPaused(): Promise<boolean>;
    setSystemPaused(value: boolean): Promise<boolean>;
    /**
     * Retrieves whether or not the system should repeat the current track.
     */
    getReplay(): Promise<boolean>;
    setReplay(value: boolean): Promise<boolean>;
    /**
     * Retrieves the volume of the track in the queue.
     */
    getVolume(): Promise<number>;
    setVolume(value: number): Promise<{
        previous: number;
        next: number;
    }>;
    seek(position: number): Promise<void>;
    connect(channelID: string): Promise<void>;
    leave(): Promise<void>;
    getTextChannel(): Promise<TextChannel | null>;
    getTextChannelID(): Promise<string | null>;
    setTextChannelID(channelID: null): Promise<null>;
    setTextChannelID(channelID: string): Promise<string>;
    getCurrentTrack(): Promise<Song | null>;
    getAt(index: number): Promise<Song | undefined>;
    removeAt(position: number): Promise<void>;
    next({ skipped }?: {
        skipped?: boolean | undefined;
    }): Promise<boolean>;
    count(): Promise<number>;
    moveTracks(from: number, to: number): Promise<void>;
    shuffleTracks(): Promise<void>;
    stop(): Promise<void>;
    clearTracks(): Promise<void>;
    skipTo(position: number): Promise<void>;
    refresh(): Promise<[error: Error | null, result: unknown][] | null>;
    clear(): Promise<number>;
    nowPlaying(): Promise<NowPlaying | null>;
    tracks(start?: number, end?: number): Promise<Song[]>;
    setEmbed(id: string): Promise<void>;
    getEmbed(): Promise<string | null>;
    deleteEmbed(): Promise<void>;
    stringifySong(song: Song): string;
    parseSongString(song: string): Song;
}
export {};
