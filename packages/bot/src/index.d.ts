import type { NewsChannel, TextChannel, ThreadChannel } from 'discord.js';
export type MessageChannel = TextChannel | ThreadChannel | NewsChannel | null;
declare module 'lavaclient' {
    interface Player {
        nightcore: boolean;
        vaporwave: boolean;
        karaoke: boolean;
        bassboost: boolean;
    }
}
