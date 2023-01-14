import { ChatInputCommandDeniedPayload, Listener, UserError } from '@sapphire/framework';
export declare class CommandDeniedListener extends Listener {
    run({ context, message: content }: UserError, { interaction }: ChatInputCommandDeniedPayload): Promise<void>;
}
