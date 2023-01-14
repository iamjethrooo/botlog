import type { Track, TrackInfo } from '@lavaclient/types/v3';
export declare class Song implements TrackInfo {
    readonly track: string;
    requester?: RequesterInfo;
    length: number;
    identifier: string;
    author: string;
    isStream: boolean;
    position: number;
    title: string;
    uri: string;
    isSeekable: boolean;
    sourceName: string;
    thumbnail: string;
    added: number;
    constructor(track: string | Track, added?: number, requester?: RequesterInfo);
}
interface RequesterInfo {
    avatar?: string | null;
    defaultAvatarURL?: string;
    id?: string;
    name?: string;
}
export {};
