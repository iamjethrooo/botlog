import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import { EmbedBuilder } from "discord.js";

@ApplyOptions<CommandOptions>({
  name: "userinfo",
  description: "Reveal information about a member.",
})
export class UserInfoCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild)
      return interaction.reply(`You can't use this command in a DM!`);
    const user = interaction.options.getUser("user", true);
    const member = interaction.guild.members.cache.get(user.id);
    const roles = member!.roles.cache
      .filter((r) => r.id !== interaction.guildId)
      .map((roles) => `<@&${roles.id}>`);
    // Determines whether to reduce the roles array, since Discord only supports up to 1024 characters on an embed.
    var cut = false;
    var max = 0;
    var count = 0;
    for (var i = 0; i < roles.length; i++) {
      count += roles[i].length + 7;
      if (count < 950) {
        max = i;
      } else {
        cut = true;
      }
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: `${user!.tag}`, iconURL: member!.displayAvatarURL() })
      .setColor(member!.displayHexColor)
      .setDescription(`<@${member!.id}>`)
      .setThumbnail(member!.displayAvatarURL())
      .addFields(
        {
          name: "Joined at: ",
          value: member!.joinedAt!.toString(),
          inline: true,
        },
        {
          name: "Created at: ",
          value: user!.createdAt!.toString(),
          inline: true,
        },
        {
          name: `Roles [${
            member!.roles.cache
              .filter((r) => r.id !== interaction.guildId)
              .map((roles) => `\`${roles.name}\``).length
          }]`,
          value: `${
            roles.length == 0
              ? "No Roles"
              : cut
              ? member!.roles.cache
                  .filter((r) => r.id !== interaction.guildId)
                  .map((roles) => `<@&${roles.id}>`)
                  .slice(0, max)
                  .concat(`... ${roles.length - max} more`)
                  .join(" **|** ")
              : member!.roles.cache
                  .filter((r) => r.id !== interaction.guildId)
                  .map((roles) => `<@&${roles.id}>`)
                  .join(" **|** ")
          }`,
          inline: true,
        }
      )
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
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
          description: "The user you want to see information on",
        },
      ],
    });
  }
}
