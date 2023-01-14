import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import type { CommandInteraction } from 'discord.js';
export declare class UserInfoCommand extends Command {
    chatInputRun(interaction: CommandInteraction): Promise<void>;
    registerApplicationCommands(registery: ApplicationCommandRegistry): void;
}
