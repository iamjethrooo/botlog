import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
  container
} from '@sapphire/framework';
import { CommandInteraction, MessageEmbed, Message, GuildMember } from 'discord.js';

@ApplyOptions<CommandOptions>({
  name: 'snipe',
  description: 'Reveal the last deleted message in the channel.'
})
export class SnipeCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    if (!interaction.guild) {
      return await interaction.reply(`You can't use this command in a DM!`);
    }
    const { client } = container;
    const sniped = client.snipes.get(interaction.channelId);

    if ((<GuildMember>interaction.member)!.permissions.has('ADMINISTRATOR') || (<GuildMember>interaction.member)!.roles.cache.find(r => r.name === 'Sniper' || r.name === 'Enforcer' || r.name === 'Ruby (Lvl. 75+)' || r.name === 'Emerald (Lvl. 60+)' || r.name === 'Sapphire (Lvl. 45+)' || r.name === 'Steel (Lvl. 30+)' || r.name === 'Obsidian (Lvl. 15+)')) {
      if (!sniped) {
        return await interaction.reply({ ephemeral: true, content: 'There\'s nothing to snipe!' });
      }
      let content = `**${sniped[0].author}**: ${sniped[0].content}`;
      if (sniped.length > 1) {
        content = `**${sniped[1].author}**: ${sniped[1].content}\n` + content;
      }
      if (sniped.length > 2) {
        content = `**${sniped[2].author}**: ${sniped[2].content}\n` + content;
      }
      const embed = new MessageEmbed()
        .setDescription(content)
        .setColor((<GuildMember>interaction.member)!.displayHexColor!)
      return await interaction.reply({ embeds: [embed] });
    }

    await interaction.reply('You don\'t have the permissions to run this command!');
    setTimeout(() => interaction.deleteReply(), 15000);
    return;
  }

  public override async messageRun(message: Message) {
    if (!message.guild) {
      return await message.reply(`You can't use this command in a DM!`);
    }
    const { client } = container;
    const sniped = client.snipes.get(message.channel.id);

    if (message.member!.permissions.has('ADMINISTRATOR') || message.member!.roles.cache.find(r => r.name === 'Sniper' || r.name === 'Enforcer' || r.name === 'Ruby (Lvl. 75+)' || r.name === 'Emerald (Lvl. 60+)' || r.name === 'Sapphire (Lvl. 45+)' || r.name === 'Steel (Lvl. 30+)' || r.name === 'Obsidian (Lvl. 15+)')) {
      if (!sniped) {
        return await message.reply('There\'s nothing to snipe!').then(message => setTimeout(() => message.delete(), 15000)).then(message.delete);
      }
      let content = `**${sniped[0].author}**: ${sniped[0].content}`;
      if (sniped.length > 1) {
        content = `**${sniped[1].author}**: ${sniped[1].content}\n` + content;
      }
      if (sniped.length > 2) {
        content = `**${sniped[2].author}**: ${sniped[2].content}\n` + content;
      }
      const embed = new MessageEmbed()
        .setDescription(content)
        .setColor(message.member!.displayHexColor!)
      return await message.reply({ embeds: [embed] });
    }
    return await message.reply('You don\'t have the permissions to run this command!').then(message => setTimeout(() => message.delete(), 15000));
  }

  public override registerApplicationCommands(
    registery: ApplicationCommandRegistry
  ): void {
    registery.registerChatInputCommand({
      name: this.name,
      description: this.description
    });
  }
}
