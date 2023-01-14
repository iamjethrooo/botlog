import { AsyncPreconditionResult, Precondition } from '@sapphire/framework';
import type { CommandInteraction } from 'discord.js';
export declare class IsCommandDisabled extends Precondition {
    chatInputRun(interaction: CommandInteraction): AsyncPreconditionResult;
}
declare module '@sapphire/framework' {
    interface Preconditions {
        isCommandDisabled: never;
    }
}
