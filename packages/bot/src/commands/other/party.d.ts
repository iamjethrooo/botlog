import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import type { CommandInteraction } from 'discord.js';
export declare class PartyCommand extends Command {
    chatInputRun(interaction: CommandInteraction): Promise<void>;
    registerApplicationCommands(registery: ApplicationCommandRegistry): void;
}
