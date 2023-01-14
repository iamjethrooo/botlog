import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { CommandInteraction, Message } from 'discord.js';
export declare class BurbankCommand extends Command {
    chatInputRun(interaction: CommandInteraction): Promise<void>;
    messageRun(message: Message): Promise<Message<boolean>>;
    registerApplicationCommands(registery: ApplicationCommandRegistry): void;
}
