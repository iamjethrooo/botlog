import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import type { CommandInteraction, Message } from 'discord.js';
export declare class CatCommand extends Command {
    chatInputRun(interaction: CommandInteraction): void;
    messageRun(message: Message): Promise<void>;
    registerApplicationCommands(registery: ApplicationCommandRegistry): void;
}
