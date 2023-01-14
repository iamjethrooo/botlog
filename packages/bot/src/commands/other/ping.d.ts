import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import type { CommandInteraction, Message } from 'discord.js';
export declare class PingCommand extends Command {
    chatInputRun(interaction: CommandInteraction): Promise<void>;
    messageRun(message: Message): Promise<Message<boolean>>;
    registerApplicationCommands(registery: ApplicationCommandRegistry): void;
}
