import { MessageEmbed } from 'discord.js';
export declare class RemindEmbed {
    userId: string;
    timeOffset: number;
    event: string;
    dateTime: string;
    description?: string;
    repeat?: string;
    constructor(userId: string, timeOffset: number, event: string, dateTime: string, description?: string, repeat?: string);
    RemindEmbed(): MessageEmbed;
}
