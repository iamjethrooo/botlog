import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import {
  Message,
  EmbedBuilder,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  User,
} from "discord.js";
import { trpcNode } from "../../trpc";

async function changeNickname(user: User, victimId: string, guildId: string) {
  // if no change nickname is ongoing, update usernickname table
  let suspectId = user.id;
  let suspect = await trpcNode.user.getUserById.query({
    id: suspectId,
  });

  const embed = new EmbedBuilder().setAuthor({
    name: `${user.username}#${user.discriminator}`,
    iconURL: user.displayAvatarURL(),
  });

  let victim = await trpcNode.user.getUserById.query({
    id: victimId,
  });

  victim = suspect; // Remove
  suspect = victim;

  await trpcNode.user.subtractCash.mutate({
    id: suspectId,
    cash: 2000,
  });
  embed.setDescription(`✅ You changed the nickname of <@${victimId}> to!`);
  embed.setColor(`#${process.env.GREEN_COLOR}`);

  return embed;
}
@ApplyOptions<CommandOptions>({
  name: "changenickname",
  description: "Change another user's nickname for 2 days.",
  preconditions: ["inBotChannel", "isNotInmate"],
})
export class ChangeNicknameCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user", true);

    let victimId = user.id;

    try {
      let resultEmbed = await changeNickname(
        interaction.user,
        victimId,
        interaction.guildId!
      );
      return await interaction.reply({ embeds: [resultEmbed] });
    } catch (error) {
      console.log(error);
      return;
    }
  }

  public override async messageRun(message: Message) {
    /*
    let hasNoMention = message.mentions.users.size < 1;
    if (hasNoMention) return;

    let victimId = message.mentions.users!.first()!.id;
    let isMod = message.member!.permissions.has("Administrator");
    let isThief = message.member!.roles.cache.has(
      `${process.env.ROLE_ID_THIEF}`
    );

    try {
      let resultEmbed = await rob(
        message.author,
        victimId,
        isThief,
        isMod,
        message.guildId!
      );
      return await message.channel.send({ embeds: [resultEmbed] });
    } catch (error) {
      console.log(error);
      return;
    } */
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
          description: `Who's nickname do you want to change?`,
        },
      ],
    });
  }
}
