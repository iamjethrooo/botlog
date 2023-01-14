import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { CommandInteraction } from 'discord.js';
export declare class AdviceCommand extends Command {
    chatInputRun(interaction: CommandInteraction): Promise<void>;
    private fetchFromReddit;
    private getData;
    registerApplicationCommands(registery: ApplicationCommandRegistry): void;
}
