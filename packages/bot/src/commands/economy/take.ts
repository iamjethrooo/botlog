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
  User,
} from "discord.js";
import { trpcNode } from "../../trpc";

async function takeFromRole(roleId: string, guildId: string, amount: number) {
  // Take cash from a role
  const { client } = container;
  const guild = client.guilds.cache.get(guildId);
  guild!.members.fetch().then((members) =>
    members.forEach(async (member) => {
      if (member.roles.cache.some((role) => role.id == roleId)) {
        // Check if user exists in database
        let user = await trpcNode.user.getUserById.query({
          id: member.user.id,
        });

        if (user.user == null) {
          // TO DO
        } else {
          await trpcNode.user.subtractCash.mutate({
            id: member.user.id,
            cash: amount,
          });
        }
      }
    })
  );
}

async function takeFromUser(user: User, amount: number) {
  const startingCash = await trpcNode.setting.getByKey.mutate({
    key: "startingCash",
  });
  // Take cash from a user
  try {
    // Check if user exists in database
    let trpcUser = await trpcNode.user.getUserById.query({
      id: user.id,
    });

    if (trpcUser.user == null) {
      await trpcNode.user.create.mutate({
        id: user.id,
        name: user.username,
      });
      await trpcNode.user.addCash.mutate({
        id: user.id,
        cash: Number(startingCash) - amount,
      });
    } else {
      await trpcNode.user.subtractCash.mutate({
        id: user.id,
        cash: amount,
      });
    }
  } catch (error) {
    console.log(error);
    return;
  }
  return;
}

@ApplyOptions<CommandOptions>({
  name: "take",
  description: "Take coins from a user.",
  preconditions: ["inBotChannel", "userIsAdmin"],
})
export class TakeCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message, args: Args) {
    let amount = await args.pick("integer").catch(() => 0);
    const coinEmoji = await trpcNode.setting.getByKey.mutate({
      key: "coinEmoji",
    });
    // Take cash from a user
    if (message.mentions.users.size == 1) {
      let first = message.mentions.users!.first()!;
      takeFromUser(first, amount);

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${message.author.username}#${message.author.discriminator}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setDescription(
          `Took ${coinEmoji}${String(amount)} from <@${first.id}>.`
        )
        .setTimestamp(message.createdAt)
        .setColor(message.member!.displayHexColor);
      return await message.reply({ embeds: [embed] });
    }
    // Take cash from a role
    else if (message.mentions.roles) {
      let roleId = message.mentions.roles.first()!.id;

      takeFromRole(roleId, message.guildId!, amount);
      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${message.author.username}#${message.author.discriminator}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setDescription(
          `Took ${coinEmoji}${String(amount)} from <@&${roleId}>.`
        )
        .setTimestamp(message.createdAt)
        .setColor(message.member!.displayHexColor);
      return await message.reply({ embeds: [embed] });
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
          required: false,
          name: "user",
          description: `Who do you want to take coins from?`,
        },
        {
          type: ApplicationCommandOptionType.Role,
          required: false,
          name: "role",
          description: "What role do you want to take coins from?",
        },
        {
          type: ApplicationCommandOptionType.Integer,
          required: true,
          name: "amount",
          description: "How many coins do you want to take?",
        },
      ],
    });
  }
}
