import { ApplicationCommandRegistry, Command, Args } from '@sapphire/framework';
import { CommandInteraction, Message } from 'discord.js';
export declare class EightBallCommand extends Command {
    chatInputRun(interaction: CommandInteraction): Promise<void>;
    messageRun(message: Message, args: Args): Promise<Message<boolean>>;
    registerApplicationCommands(registery: ApplicationCommandRegistry): void;
}
