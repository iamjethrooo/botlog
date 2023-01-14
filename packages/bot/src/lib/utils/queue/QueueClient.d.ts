import Redis from 'ioredis';
import type { RedisOptions } from 'ioredis';
import { ConnectionInfo, Node, SendGatewayPayload } from 'lavaclient';
import { QueueStore } from './QueueStore';
export interface QueueClientOptions {
    redis: Redis | RedisOptions;
}
export interface ConstructorTypes {
    options: QueueClientOptions;
    sendGatewayPayload: SendGatewayPayload;
    connection: ConnectionInfo;
}
export declare class QueueClient extends Node {
    readonly queues: QueueStore;
    constructor({ options, sendGatewayPayload, connection }: ConstructorTypes);
}
