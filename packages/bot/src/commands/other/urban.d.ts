import { ApplicationCommandRegistry, Command, Args } from '@sapphire/framework';
import { CommandInteraction, Message } from 'discord.js';
export declare class UrbanCommand extends Command {
    chatInputRun(interaction: CommandInteraction): void;
    messageRun(message: Message, args: Args): Promise<void>;
    registerApplicationCommands(registery: ApplicationCommandRegistry): void;
}
