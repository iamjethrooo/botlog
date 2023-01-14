/// <reference types="node" />
import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { CommandInteraction, Message } from 'discord.js';
export declare class EditSnipeCommand extends Command {
    chatInputRun(interaction: CommandInteraction): Promise<void>;
    messageRun(message: Message): Promise<Message<boolean> | NodeJS.Timeout | undefined>;
    registerApplicationCommands(registery: ApplicationCommandRegistry): void;
}
