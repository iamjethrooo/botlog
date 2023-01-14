import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from '@sapphire/framework';
import type { CommandInteraction } from 'discord.js';
import { MessageEmbed } from 'discord.js';

@ApplyOptions<CommandOptions>({
  name: 'userinfo',
  description: 'Reveal information about a member.'
})
export class UserInfoCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    if (!interaction.guild) return interaction.reply(`You can't use this command in a DM!`);
    const user = interaction.options.getUser('user', true);
    const member = interaction.guild.members.cache.get(user.id);
    const roles = member!.roles.cache.filter(r => r.id !== interaction.guildId).map(roles => `<@&${roles.id}>`)
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

    const embed = new MessageEmbed()
      .setAuthor(`${user!.tag}`, member!.displayAvatarURL({ dynamic: true }))
      .setColor(member!.displayHexColor)
      .setDescription(`<@${member!.id}>`)
      .setThumbnail(member!.displayAvatarURL({ dynamic: true }))
      .addField('Joined at: ', member!.joinedAt!.toString(), true)
      .addField('Created at: ', user!.createdAt!.toString(), true)
      .addField(`Roles [${member!.roles.cache.filter(r => r.id !== interaction.guildId).map(roles => `\`${roles.name}\``).length}]`, `${roles.length == 0 ? "No Roles" : cut ? member!.roles.cache.filter(r => r.id !== interaction.guildId).map(roles => `<@&${roles.id}>`).slice(0, max).concat(`... ${roles.length - max} more`).join(" **|** ") : member!.roles.cache.filter(r => r.id !== interaction.guildId).map(roles => `<@&${roles.id}>`).join(" **|** ")}`, true)
      .setTimestamp();
    interaction.reply({ embeds: [embed] });
  }

  public override registerApplicationCommands(
    registery: ApplicationCommandRegistry
  ): void {
    registery.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          type: 'USER',
          required: true,
          name: 'user',
          description: 'The user you want to see information on'
        }
      ]
    });
  }
}
