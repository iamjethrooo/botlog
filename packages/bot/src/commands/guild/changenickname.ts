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
} from "discord.js";
@ApplyOptions<CommandOptions>({
  name: "changenickname",
  description: "Change another user's nickname for 2 days.",
  preconditions: ["inBotChannel", "isNotInmate"],
})
export class ChangeNicknameCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    return interaction.reply({
      content:
        "Nickname changes are temporarily unavailable. No coins were charged.",
      ephemeral: true,
    });
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
