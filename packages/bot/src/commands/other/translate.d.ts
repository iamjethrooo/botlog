import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { CommandInteraction } from 'discord.js';
export declare class TranslateCommand extends Command {
    chatInputRun(interaction: CommandInteraction): void;
    registerApplicationCommands(registry: ApplicationCommandRegistry): void;
}
