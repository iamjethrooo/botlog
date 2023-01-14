import Collection from '@discordjs/collection';
import type { Redis, RedisKey } from 'ioredis';
import { Queue } from './Queue';
import type { QueueClient } from './QueueClient';
export interface ExtendedRedis extends Redis {
    lmove: (key: RedisKey, from: number, to: number) => Promise<'OK'>;
    lremat: (key: RedisKey, index: number) => Promise<'OK'>;
    lshuffle: (key: RedisKey, seed: number) => Promise<'OK'>;
    rpopset: (source: RedisKey, destination: RedisKey) => Promise<string | null>;
}
export declare class QueueStore extends Collection<string, Queue> {
    readonly client: QueueClient;
    redis: ExtendedRedis;
    constructor(client: QueueClient, redis: Redis);
    get(key: string): Queue;
    start(): Promise<void>;
    private getPlayingEntries;
}
