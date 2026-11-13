import { ApplyOptions } from "@sapphire/decorators";
import {
    ApplicationCommandRegistry,
    Command,
    CommandOptions,
    Args,
} from "@sapphire/framework";
import {
    ChatInputCommandInteraction,
    User,
    GuildMember,
    Message,
    EmbedBuilder,
    ApplicationCommandOptionType,
} from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
    name: "transfer",
    description: "Transfer coins to a user.",
    preconditions: ["inBotChannel", "isNotInmate"],
})
export class TransferCommand extends Command {
    private async transfer(source: User, member: GuildMember, recipient: User | undefined, amount: number) {
        const coinEmoji = await trpcNode.setting.getByKey.mutate({ key: "coinEmoji" });
        const redColor = await trpcNode.setting.getByKey.mutate({ key: "redColor" });
        const embed = new EmbedBuilder().setAuthor({ name: source.username, iconURL: source.displayAvatarURL() });
        const fail = (text: string) => embed.setDescription(`❌ ${text}`).setColor(`#${redColor}`);
        if (!recipient) return fail("Mention exactly one user to transfer coins to.");
        if (!Number.isInteger(amount) || amount <= 0 || amount > 2147483647) return fail("Enter a positive whole number of coins.");
        if (source.id === recipient.id) return fail("You cannot transfer coins to yourself.");
        try {
            await trpcNode.user.transfer.mutate({
                sourceId: source.id, recipientId: recipient.id, recipientName: recipient.username, amount,
            });
            return embed.setDescription(`Gave <@${recipient.id}> ${coinEmoji}${amount}.`).setColor(member.displayHexColor);
        } catch (error) {
            const failure = error as { data?: { code?: string }; message?: string };
            if (failure.data?.code === "BAD_REQUEST") return fail(failure.message!);
            console.error("Transfer could not be confirmed", error);
            return fail("The transfer could not be confirmed. Check both balances before trying again.");
        }
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const embed = await this.transfer(interaction.user, interaction.member as GuildMember,
            interaction.options.getUser("user", true), interaction.options.getInteger("amount", true));
        return interaction.editReply({ embeds: [embed] });
    }

    public override async messageRun(message: Message, args: Args) {
        const amount = await args.pick("integer").catch(() => 0);
        const recipient = message.mentions.users.size === 1 ? message.mentions.users.first() : undefined;
        const embed = await this.transfer(message.author, message.member!, recipient, amount);
        return message.reply({ embeds: [embed] });
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
                    required: true,
                    name: "user",
                    description: `Who do you want to give coins to?`,
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    required: true,
                    name: "amount",
                    min_value: 1,
                    max_value: 2147483647,
                    description: "How many coins do you want to give?",
                },
            ],
        });
    }
}
