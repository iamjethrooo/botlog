import { CommandInteraction, User } from 'discord.js';
export declare class Connect4Game {
    connect4(interaction: CommandInteraction, playerMap: Map<string, User>): Promise<void>;
}
