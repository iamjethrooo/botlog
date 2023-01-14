import { Listener } from '@sapphire/framework';
import type { VoiceState } from 'discord.js';
export declare class VoiceStateUpdateListener extends Listener {
    run(oldState: VoiceState, newState: VoiceState): Promise<void>;
}
