import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import {
  ApplicationCommandOptionType,
  ChannelType,
  ChatInputCommandInteraction,
  GuildMember,
  VoiceChannel,
} from "discord.js";

@ApplyOptions<CommandOptions>({
  name: "activity",
  description: "Generate an invite link to your voice channel's activity",
  preconditions: ["GuildOnly", "inVoiceChannel"],
})
export class ActivityCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const channel: VoiceChannel = interaction.options.getChannel(
      "channel",
      true
    );
    const activity = interaction.options.getString("activity", true);

    if (channel.type !== ChannelType.GuildVoice) {
      return await interaction.reply(
        "You can only invite someone to a voice channel!"
      );
    }

    const member = interaction.member as GuildMember;

    if (member.voice.channelId !== channel.id) {
      return await interaction.reply(
        "You can only invite to the channel you are in!"
      );
    }

    let invite;
    try {
      invite = await channel.createInvite({
        reason: "Activity command generated invite",
      });
    } catch (err) {
      return await interaction.reply(`Something went wrong!`);
    }

    return await interaction.reply(
      `[Click to join ${activity} in ${channel.name}](${invite.url})`
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
          type: ApplicationCommandOptionType.Channel,
          required: true,
          name: "channel",
          description: "Channel to invite to",
        },
        {
          type: ApplicationCommandOptionType.String,
          required: true,
          name: "activity",
          description: "Activity description",
        },
      ],
    });
  }
}
