import { ApplyOptions } from "@sapphire/decorators";
import {
    ApplicationCommandRegistry,
    Command,
    CommandOptions,
    Args,
} from "@sapphire/framework";
import {
    CommandInteraction,
    Message,
    EmbedBuilder,
    ApplicationCommandOptionType,
} from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
    name: "transfer",
    description: "Transfer coins to a user.",
    preconditions: ["inBotChannel", "userIsAdmin"],
})
export class TransferCommand extends Command {
    public override async chatInputRun(interaction: CommandInteraction) { }

    public override async messageRun(message: Message, args: Args) {
        let amount = await args.pick("integer").catch(() => 0);
        const coinEmoji = await trpcNode.setting.getByKey.mutate({
            key: "coinEmoji",
        });
        const startingCash = await trpcNode.setting.getByKey.mutate({
            key: "startingCash",
        });
        const redColor = await trpcNode.setting.getByKey.mutate({
            key: "redColor",
        });

        let sourceId = message.author.id;
        let user = await trpcNode.user.getUserById.query({
            id: sourceId,
        });
        // Give cash to a user
        if (message.mentions.users.size == 1) {
            console.log(message.mentions.users!.first()!.id);
            let id = message.mentions.users!.first()!.id;
            const embed = new EmbedBuilder().setAuthor({
                name: `${message.author.username}`,
                iconURL: message.author.displayAvatarURL(),
            });

            if (amount > user!.user!.cash) {
                embed.setDescription(`❌ You cannot transfer more than your current balance.`)
                embed.setColor(`#${redColor}`);
                return await message.reply({ embeds: [embed] });
            }
            try {
                // Check if user exists in database
                let user = await trpcNode.user.getUserById.query({
                    id: id,
                });

                if (user.user == null) {
                    await trpcNode.user.create.mutate({
                        id: id,
                        name: message.author.username,
                    });
                    await trpcNode.user.addCash.mutate({
                        id: id,
                        cash: Number(startingCash) + amount,
                    });
                } else {
                    await trpcNode.user.addCash.mutate({
                        id: id,
                        cash: amount,
                    });
                    await trpcNode.user.subtractCash.mutate({
                        id: sourceId,
                        cash: amount,
                    });
                }

                embed.setDescription(`Gave <@${id}> ${coinEmoji}${String(amount)}.`);
                embed.setColor(message.member!.displayHexColor);
                return await message.reply({ embeds: [embed] });
            } catch (error) {
                console.log(error);
                return;
            }
        }
        return;
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
                    description: "How many coins do you want to give?",
                },
            ],
        });
    }
}
