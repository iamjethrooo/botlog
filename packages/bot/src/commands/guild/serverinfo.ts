import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import { ChatInputCommandInteraction } from "discord.js";
import { EmbedBuilder } from "discord.js";

@ApplyOptions<CommandOptions>({
  name: "serverinfo",
  description: "Reveal information about the server.",
})
export class ServerInfoCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild)
      return interaction.reply(`You can't use this command in a DM!`);
    // const user = interaction.options.getUser("user", true);
    const randomColor = "000000".replace(/0/g, function () {
      return (~~(Math.random() * 16)).toString(16);
    });
    await interaction.guild.members.fetch({ withPresences: true });
    const icon = interaction.guild.iconURL();
    const embed = new EmbedBuilder()
      .setAuthor({ name: interaction.guild.name, iconURL: icon! })
      .setColor(`#${randomColor}`)
      .setThumbnail(icon)
      .addFields(
        {
          name: "Server Owner",
          value: interaction.guild.ownerId,
          inline: true,
        },
        {
          name: "Total Member Count",
          value: interaction.guild.memberCount.toString(),
        },
        {
          name: "Humans",
          value: countHumans(interaction.guild).toString(),
          inline: true,
        },
        {
          name: "Bots",
          value: countBots(interaction.guild).toString(),
          inline: true,
        },
        {
          name: "Online",
          value: countOnlineUsers(interaction.guild).toString(),
        }
      )
      .setFooter({ text: "Server created at:" })
      .setTimestamp(interaction.guild.createdAt);
    return interaction.reply({ embeds: [embed] });
  }

  public override registerApplicationCommands(
    registery: ApplicationCommandRegistry
  ): void {
    registery.registerChatInputCommand({
      name: this.name,
      description: this.description,
    });
  }
}

function countBots(guild) {
  return guild.members.cache.filter((member) => {
    return member.user.bot;
  }).size;
}

function countHumans(guild) {
  return guild.members.cache.filter((member) => {
    return !member.user.bot;
  }).size;
}

function countOnlineUsers(guild) {
  return guild.members.cache.filter((member) => {
    return (
      (!member.user.bot && member.presence?.status == "online") ||
      member.presence?.status == "idle" ||
      member.presence?.status == "dnd"
    );
  }).size;
}
