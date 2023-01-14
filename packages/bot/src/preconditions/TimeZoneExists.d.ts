import { AsyncPreconditionResult, Precondition } from '@sapphire/framework';
import type { CommandInteraction } from 'discord.js';
export declare class TimeZoneExists extends Precondition {
    chatInputRun(interaction: CommandInteraction): AsyncPreconditionResult;
}
declare module '@sapphire/framework' {
    interface Preconditions {
        timeZoneExists: never;
    }
}
