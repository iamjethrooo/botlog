import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { CommandInteraction } from 'discord.js';
export declare class SpeedRunCommand extends Command {
    chatInputRun(interaction: CommandInteraction): Promise<void>;
    static myButtons(message: PaginatedMessage, categories: any, queryCat: string): PaginatedMessage;
    static embedGenerator(categories: any, queryCat: string): PaginatedMessage;
    static convertTime(time: number): string;
    registerApplicationCommands(registery: ApplicationCommandRegistry): void;
}
