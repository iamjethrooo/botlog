/// <reference types="node" />
import { ApplicationCommandRegistry, Command, Args } from "@sapphire/framework";
import { CommandInteraction, Message } from "discord.js";
export declare class SnipeCommand extends Command {
    chatInputRun(interaction: CommandInteraction): Promise<void>;
    messageRun(message: Message, args: Args): Promise<Message<boolean> | NodeJS.Timeout>;
    registerApplicationCommands(registery: ApplicationCommandRegistry): void;
}
