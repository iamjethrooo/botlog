import { Precondition, PreconditionResult } from '@sapphire/framework';
import type { CommandInteraction } from 'discord.js';
export declare class inPlayerVoiceChannel extends Precondition {
    chatInputRun(interaction: CommandInteraction): PreconditionResult;
}
declare module '@sapphire/framework' {
    interface Preconditions {
        inPlayerVoiceChannel: never;
    }
}
