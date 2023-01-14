import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import type { CommandInteraction, Message } from 'discord.js';
export declare class BakaCommand extends Command {
    chatInputRun(interaction: CommandInteraction): void;
    messageRun(message: Message): Promise<void>;
    registerApplicationCommands(registery: ApplicationCommandRegistry): void;
}
