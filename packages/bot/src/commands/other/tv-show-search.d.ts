import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import type { CommandInteraction } from 'discord.js';
export declare class TVShowSearchCommand extends Command {
    chatInputRun(interaction: CommandInteraction): Promise<void>;
    registerApplicationCommands(registery: ApplicationCommandRegistry): void;
    private getData;
    private constructInfoObject;
    private filterSummary;
    private checkGenres;
    private checkIfNull;
    private checkNetwork;
}
