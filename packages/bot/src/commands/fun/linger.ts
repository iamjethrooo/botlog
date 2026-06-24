import { ApplyOptions } from "@sapphire/decorators";
import {
    ApplicationCommandRegistry,
    Command,
    CommandOptions,
} from "@sapphire/framework";
import {
    Message,
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
    User,
    TextChannel,
} from "discord.js";

@ApplyOptions<CommandOptions>({
    name: "linger",
    description: "BUT I'M IN SO DEEEP",
})
export class LingerCommand extends Command {
    private buildLingerMessage(user: User) {
        return `<@${user.id}> is lingering... 🎧💔

🕯️🌧️🎵 But I'm in so deep...
😔 You know I'm such a fool for you
🫵💍 You got me wrapped around your finger, oh-oh-oh
😭💭 Do you have to let it linger?

❓ Do you have to?
❓ Do you have to?
😭💭 Do you have to let it linger?`;
    }
    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        const user =
            interaction.options.getUser("user") || interaction.user;

        return await interaction.reply({
            content: this.buildLingerMessage(user),
        });
    }

    public override async messageRun(message: Message) {
        const mentionedUser = message.mentions.users.first();
        const user = mentionedUser || message.author;

        return await (message.channel as TextChannel).send(
            this.buildLingerMessage(user)
        );
    }

    public override registerApplicationCommands(
        registery: ApplicationCommandRegistry
    ): void {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description,
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    required: false,
                    name: "user",
                    description: `The lingerer`,
                },
            ],
        });
    }
}
