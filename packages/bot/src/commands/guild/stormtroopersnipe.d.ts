/// <reference types="node" />
import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { CommandInteraction, Message } from 'discord.js';
export declare class StormtrooperSnipeCommand extends Command {
    chatInputRun(interaction: CommandInteraction): Promise<void>;
    messageRun(message: Message): Promise<Message<boolean> | NodeJS.Timeout>;
    registerApplicationCommands(registery: ApplicationCommandRegistry): void;
}
