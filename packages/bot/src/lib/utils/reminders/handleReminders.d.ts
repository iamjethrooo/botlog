import { CommandInteraction, ModalSubmitInteraction } from 'discord.js';
export interface ReminderI {
    userId: string;
    timeOffset: number;
    event: string;
    description: string | null;
    dateTime: string;
    repeat: string | null;
}
export declare function saveReminder(userId: string, reminder: ReminderI): Promise<boolean>;
export declare function removeReminder(userId: string, event: string, sendReply: boolean): Promise<string>;
export declare function checkReminders(): Promise<void>;
export declare function convertInputsToISO(userOffset: number, timeQuery: string, date: string): string;
export declare function isPast(dateTime: string): boolean;
export declare function nextReminder(timeOffset: number, repeat: string, isoStr: string): {
    date: string;
    time: string;
};
export declare function checkInputs(interaction: CommandInteraction | ModalSubmitInteraction, event: string, time?: string, date?: string, description?: string, repeat?: string): Promise<boolean>;
export declare function askForDateTime(interaction: CommandInteraction): Promise<void>;
