import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { CommandInteraction, Message } from 'discord.js';
export declare class InsultCommand extends Command {
    chatInputRun(interaction: CommandInteraction): void;
    messageRun(message: Message): Promise<void>;
    registerApplicationCommands(registery: ApplicationCommandRegistry): void;
}
