import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
  Args,
  container,
} from "@sapphire/framework";
import {
  CommandInteraction,
  Message,
  EmbedBuilder,
  ApplicationCommandOptionType,
} from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "give",
  description: "Give coins to a user.",
  preconditions: ["inBotChannel", "userIsAdmin"],
})
export class GiveCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message, args: Args) {
    let amount = await args.pick("integer").catch(() => 0);
    const coinEmoji = await trpcNode.setting.getByKey.mutate({
      key: "coinEmoji",
    });
    const startingCash = await trpcNode.setting.getByKey.mutate({
      key: "startingCash",
    });
    // Give cash to a user
    if (message.mentions.users.size == 1) {
      console.log(message.mentions.users!.first()!.id);
      let id = message.mentions.users!.first()!.id;
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
        }

        const embed = new EmbedBuilder()
          .setAuthor({
            name: `${message.author.username}#${message.author.discriminator}`,
            iconURL: message.author.displayAvatarURL(),
          })
          .setDescription(`Gave <@${id}> ${coinEmoji}${String(amount)}.`)
          .setTimestamp(message.createdAt)
          .setColor(message.member!.displayHexColor);
        return await message.reply({ embeds: [embed] });
      } catch (error) {
        console.log(error);
        return;
      }
    }
    // Give cash to a role
    else if (message.mentions.roles) {
      let id = message.mentions.roles.first()!.id;

      const { client } = container;
      const guild = client.guilds.cache.get(message.guildId!);
      try {
        guild!.members.fetch().then((members) =>
          members.forEach(async (member) => {
            if (member.roles.cache.some((role) => role.id == id)) {
              //

              // Check if user exists in database
              let user = await trpcNode.user.getUserById.query({
                id: member.user.id,
              });

              if (user.user == null) {
                await trpcNode.user.create.mutate({
                  id: member.user.id,
                  name: message.author.username,
                });
                await trpcNode.user.addCash.mutate({
                  id: member.user.id,
                  cash: Number(startingCash) + amount,
                });
              } else {
                await trpcNode.user.addCash.mutate({
                  id: member.user.id,
                  cash: amount,
                });
              }
            }
          })
        );

        const embed = new EmbedBuilder()
          .setAuthor({
            name: `${message.author.username}#${message.author.discriminator}`,
            iconURL: message.author.displayAvatarURL(),
          })
          .setDescription(`Gave <@&${id}> ${coinEmoji}${String(amount)}.`)
          .setTimestamp(message.createdAt)
          .setColor(message.member!.displayHexColor);
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
