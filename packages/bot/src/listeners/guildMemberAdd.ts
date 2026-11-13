import { ApplyOptions } from '@sapphire/decorators';
import { Listener, type ListenerOptions } from '@sapphire/framework';
import { ChannelType, PermissionFlagsBits, type GuildMember } from 'discord.js';
import { trpcNode } from '../trpc';

@ApplyOptions<ListenerOptions>({ name: 'guildMemberAdd' })
export class GuildMemberAddListener extends Listener {
  public override async run(member: GuildMember) {
    if (member.user.bot) return;

    const { guild: settings } = await trpcNode.guild.getGuild.query({ id: member.guild.id });
    if (!settings?.welcomeMessageEnabled || !settings.welcomeMessageChannel || !settings.welcomeMessage?.trim()) return;

    const channel = member.guild.channels.cache.get(settings.welcomeMessageChannel);
    if (channel?.type !== ChannelType.GuildText && channel?.type !== ChannelType.GuildAnnouncement) return;
    const bot = member.guild.members.me;
    if (!bot || !channel.permissionsFor(bot)?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) return;

    const content = settings.welcomeMessage
      .replace(/\{(member|server)\}/g, (_, token) => token === 'member' ? member.displayName : member.guild.name)
      .trim()
      .slice(0, 2000)
      .replace(/[\uD800-\uDBFF]$/, '');
    if (!content) return;
    try {
      await channel.send({ content, allowedMentions: { parse: [] } });
    } catch {
      this.container.logger.warn('Could not deliver a configured welcome message.');
    }
  }
}
