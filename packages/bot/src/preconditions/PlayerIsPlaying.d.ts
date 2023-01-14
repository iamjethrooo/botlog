import { Precondition, PreconditionResult } from '@sapphire/framework';
import type { CommandInteraction } from 'discord.js';
export declare class PlayerIsPlaying extends Precondition {
    chatInputRun(interaction: CommandInteraction): PreconditionResult;
}
declare module '@sapphire/framework' {
    interface Preconditions {
        playerIsPlaying: never;
    }
}
