import {
  ChannelType, OverwriteType, PermissionFlagsBits,
  type APIChannel, type APIGuild, type APIGuildMember, type RESTGetAPIGuildChannelsResult,
} from 'discord-api-types/v10';
import { discordRequest } from './discord';

export type FeatureHealth = {
  state: 'healthy' | 'attention' | 'disabled' | 'unavailable';
  detail: string;
  nextStep: string;
};

export const channelFeatureSettings = {
  hub: true,
  hubChannel: true,
  welcomeMessageEnabled: true,
  welcomeMessageChannel: true,
  welcomeMessage: true,
} as const;

type ChannelFeatureSettings = {
  hub: string | null;
  hubChannel: string | null;
  welcomeMessageEnabled: boolean;
  welcomeMessageChannel: string | null;
  welcomeMessage: string | null;
};

const api = 'https://discord.com/api/v10';
const botHeaders = () => ({ Authorization: `Bot ${process.env.DISCORD_TOKEN}` });

export function fetchGuildChannels(guildId: string) {
  return discordRequest<RESTGetAPIGuildChannelsResult>(
    `${api}/guilds/${guildId}/channels`, { headers: botHeaders() }, 'Fetching server channels'
  );
}

function botPermissions(guild: APIGuild, member: APIGuildMember, botId: string) {
  const roleIds = new Set(member.roles);
  const base = guild.roles.reduce((bits, role) =>
    role.id === guild.id || roleIds.has(role.id) ? bits | BigInt(role.permissions) : bits, BigInt(0)
  );
  const bypass = guild.owner_id === botId || Boolean(base & PermissionFlagsBits.Administrator);

  return (channel: APIChannel | undefined, required: Record<string, bigint>) => {
    if (bypass) return [];
    let bits = base;
    let roleAllow = BigInt(0);
    let roleDeny = BigInt(0);
    let memberOverwrite;
    // Everyone, then the combined role overrides, then the bot's own override.
    const overwrites = channel && 'permission_overwrites' in channel ? channel.permission_overwrites : undefined;
    for (const overwrite of overwrites ?? []) {
      if (overwrite.type === OverwriteType.Role && overwrite.id === guild.id) {
        bits = (bits & ~BigInt(overwrite.deny)) | BigInt(overwrite.allow);
      } else if (overwrite.type === OverwriteType.Role && roleIds.has(overwrite.id)) {
        roleAllow |= BigInt(overwrite.allow);
        roleDeny |= BigInt(overwrite.deny);
      } else if (overwrite.type === OverwriteType.Member && overwrite.id === botId) {
        memberOverwrite = overwrite;
      }
    }
    bits = (bits & ~roleDeny) | roleAllow;
    if (memberOverwrite) bits = (bits & ~BigInt(memberOverwrite.deny)) | BigInt(memberOverwrite.allow);
    return Object.entries(required).flatMap(([name, flag]) => (bits & flag) ? [] : [name]);
  };
}

function voiceSetup(settings: ChannelFeatureSettings): FeatureHealth | null {
  if (!settings.hub && !settings.hubChannel) {
    return { state: 'disabled', detail: 'The voice hub is off.', nextStep: 'Enable the hub to create a Join To Create channel.' };
  }
  if (!settings.hub || !settings.hubChannel) {
    return { state: 'attention', detail: 'The saved hub is missing a channel or category.', nextStep: 'Review the existing hub setup before recreating it.' };
  }
  return null;
}

function welcomeSetup(settings: ChannelFeatureSettings): FeatureHealth | null {
  if (!settings.welcomeMessageEnabled) {
    return { state: 'disabled', detail: 'Welcome messages are off.', nextStep: 'Choose a destination, write a greeting, and enable the feature.' };
  }
  if (!settings.welcomeMessageChannel || !settings.welcomeMessage?.trim()) {
    return { state: 'attention', detail: 'The welcome message or destination is missing.', nextStep: 'Choose a text channel and save a greeting.' };
  }
  return null;
}

function checkVoice(
  channel: APIChannel | undefined,
  category: APIChannel | undefined,
  missingPermissions: ReturnType<typeof botPermissions>
): FeatureHealth {
  if (category?.type !== ChannelType.GuildCategory || channel?.type !== ChannelType.GuildVoice) {
    const invalidCategory = category?.type !== ChannelType.GuildCategory;
    const invalidChannel = channel?.type !== ChannelType.GuildVoice;
    const missing = invalidChannel && invalidCategory ? 'voice channel and category are' :
      invalidChannel ? 'voice channel is' : 'category is';
    return { state: 'attention', detail: `The saved ${missing} missing, inaccessible, or the wrong type in Discord.`,
      nextStep: 'Check whether BBC Bot can see the hub. If it was deleted, review the saved setup and recreate it.' };
  }
  if (channel.parent_id !== category.id) {
    return { state: 'attention', detail: 'The voice hub is outside its configured category.',
      nextStep: 'Move the Join To Create channel back into its configured category in Discord.' };
  }
  // The bot grants these permissions to the creator when it creates a room.
  const missingAtServer = missingPermissions(undefined, {
    'Manage Channels': PermissionFlagsBits.ManageChannels, 'Move Members': PermissionFlagsBits.MoveMembers,
    'Mute Members': PermissionFlagsBits.MuteMembers, 'Deafen Members': PermissionFlagsBits.DeafenMembers,
    Video: PermissionFlagsBits.Stream, Connect: PermissionFlagsBits.Connect,
  });
  const missingAtCategory = missingPermissions(category, {
    'View Channel': PermissionFlagsBits.ViewChannel, 'Manage Channels': PermissionFlagsBits.ManageChannels,
  });
  const missingAtHub = missingPermissions(channel, {
    'View Channel': PermissionFlagsBits.ViewChannel, Connect: PermissionFlagsBits.Connect,
    'Move Members': PermissionFlagsBits.MoveMembers,
  });
  const missing = [
    missingAtServer.length ? `Server: ${missingAtServer.join(', ')}` : '',
    missingAtCategory.length ? `Category: ${missingAtCategory.join(', ')}` : '',
    missingAtHub.length ? `Voice hub: ${missingAtHub.join(', ')}` : '',
  ].filter(Boolean);
  if (missing.length) {
    return { state: 'attention', detail: `BBC Bot is missing permissions. ${missing.join(' · ')}.`,
      nextStep: 'Update BBC Bot’s role or the listed channel overrides in Discord, then check again.' };
  }
  return { state: 'healthy', detail: 'The hub channel, category, and core permissions check out.',
    nextStep: 'Join the hub in Discord to test temporary channel creation.' };
}

function checkWelcome(channel: APIChannel | undefined, missingPermissions: ReturnType<typeof botPermissions>): FeatureHealth {
  if (!channel || (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement)) {
    return { state: 'attention', detail: 'The saved welcome channel is missing or inaccessible in Discord.',
      nextStep: 'Restore BBC Bot’s access or choose another text or announcement channel.' };
  }
  const missing = missingPermissions(channel, {
    'View Channel': PermissionFlagsBits.ViewChannel, 'Send Messages': PermissionFlagsBits.SendMessages,
  });
  if (missing.length) {
    return { state: 'attention', detail: `BBC Bot is missing ${missing.join(' and ')} in #${channel.name}.`,
      nextStep: 'Grant those permissions in Discord or choose a different destination.' };
  }
  return { state: 'healthy', detail: `BBC Bot can view and send messages in #${channel.name}.`,
    nextStep: 'Open settings to preview or update the greeting.' };
}

export async function checkChannelFeatureHealth(guildId: string, settings: ChannelFeatureSettings) {
  const voice = voiceSetup(settings);
  const welcome = welcomeSetup(settings);
  if (voice && welcome) return { voice, welcome };

  const unavailable: FeatureHealth = {
    state: 'unavailable',
    detail: 'Couldn’t verify the Discord setup.',
    nextStep: 'Use Recheck features to try again.'
  };
  const botId = process.env.DISCORD_CLIENT_ID;
  if (!botId || !/^\d{17,20}$/.test(botId)) return { voice: voice ?? unavailable, welcome: welcome ?? unavailable };

  try {
    const [channels, guild, member] = await Promise.all([
      fetchGuildChannels(guildId),
      discordRequest<APIGuild>(`${api}/guilds/${guildId}`, { headers: botHeaders() }, 'Fetching bot server roles'),
      discordRequest<APIGuildMember>(`${api}/guilds/${guildId}/members/${botId}`,
        { headers: botHeaders() }, 'Fetching bot server membership'),
    ]);
    const permissions = botPermissions(guild, member, botId);
    const channel = (id: string | null) => channels.find(channel => channel.id === id);
    return {
      voice: voice ?? checkVoice(channel(settings.hubChannel), channel(settings.hub), permissions),
      welcome: welcome ?? checkWelcome(channel(settings.welcomeMessageChannel), permissions),
    };
  } catch {
    return { voice: voice ?? unavailable, welcome: welcome ?? unavailable };
  }
}
