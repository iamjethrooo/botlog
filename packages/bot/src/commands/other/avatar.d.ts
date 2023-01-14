import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { CommandInteraction } from 'discord.js';
export declare class AvatarCommand extends Command {
    chatInputRun(interaction: CommandInteraction): Promise<void>;
    registerApplicationCommands(registery: ApplicationCommandRegistry): void;
}
