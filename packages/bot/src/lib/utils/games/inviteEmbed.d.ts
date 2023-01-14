import { CommandInteraction, MessageEmbed, User, MessageActionRow } from 'discord.js';
export declare class GameInvite {
    title: string;
    players: User[];
    interaction: CommandInteraction;
    constructor(title: string, players: User[], interaction: CommandInteraction);
    gameInviteEmbed(): MessageEmbed;
    gameInviteButtons(): MessageActionRow;
}
