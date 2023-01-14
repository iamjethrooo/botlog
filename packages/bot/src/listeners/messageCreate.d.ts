import { Listener } from "@sapphire/framework";
import { Message } from "discord.js";
export declare class MessageListener extends Listener {
    run(message: Message): Promise<void>;
}
