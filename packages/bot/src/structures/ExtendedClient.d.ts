/// <reference types="node" />
import { SapphireClient } from '@sapphire/framework';
import { Message } from 'discord.js';
import { QueueClient } from '../lib/utils/queue/QueueClient';
export declare class ExtendedClient extends SapphireClient {
    readonly music: QueueClient;
    leaveTimers: {
        [key: string]: NodeJS.Timer;
    };
    snipes: Map<string, Message[]>;
    editsnipes: Map<string, Message>;
    constructor();
}
declare module '@sapphire/framework' {
    interface SapphireClient {
        readonly music: QueueClient;
        leaveTimers: {
            [key: string]: NodeJS.Timer;
        };
        snipes: Map<string, Message[]>;
        editsnipes: Map<string, Message>;
    }
}
