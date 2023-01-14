import { CommandInteraction, User } from 'discord.js';
export declare class TicTacToeGame {
    ticTacToe(interaction: CommandInteraction, playerMap: Map<string, User>): Promise<void>;
}
