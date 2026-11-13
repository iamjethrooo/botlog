import { ApplyOptions } from "@sapphire/decorators";
import { Listener, ListenerOptions } from "@sapphire/framework";
import {
  ChannelType,
  DiscordAPIError,
  PermissionFlagsBits,
  VoiceState,
} from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<ListenerOptions>({
  name: "voiceStateUpdate",
})
export class VoiceStateUpdateListener extends Listener {
  public override async run(
    oldState: VoiceState,
    newState: VoiceState
  ): Promise<void> {
    const { guild: guildDB } = await trpcNode.guild.getGuild.query({
      id: newState.guild.id,
    });

    // now user is in hub channel, create him a new voice channel and move him there
    if (newState.channelId) {
      if (!newState.member) return; // should not happen but just in case

      if (newState.channelId === guildDB?.hubChannel && guildDB.hub) {
        const { tempChannel } = await trpcNode.hub.getTempChannel.query({
          guildId: newState.guild.id,
          ownerId: newState.member.id,
        });
        // user entered hub channel but he already has a temp channel, so move him there
        if (tempChannel) {
          await newState.setChannel(tempChannel.id);
          return;
        }

        const guild = newState.guild;
        const channels = guild.channels;

        const channel = await channels.create({
          name: `${newState.member.user.username}'s channel`,
          parent: guildDB?.hub,
          type: ChannelType.GuildVoice,
          permissionOverwrites: [
            {
              id: newState.member.id,
              allow: [
                PermissionFlagsBits.MoveMembers,
                PermissionFlagsBits.MuteMembers,
                PermissionFlagsBits.DeafenMembers,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.Stream,
              ],
            },
          ],
        });

        const registration = { guildId: guild.id, ownerId: newState.member.id, channelId: channel.id };
        const register = () => trpcNode.hub.createTempChannel.mutate(registration);
        // Retry the same registration after a lost response. The unique key
        // makes both calls return the winning channel, even during a race.
        let registered;
        try {
          ({ tempChannel: registered } = await register());
        } catch {
          try {
            ({ tempChannel: registered } = await register());
          } catch (error) {
            ({ tempChannel: registered } = await trpcNode.hub.getTempChannel.query({
              guildId: guild.id, ownerId: newState.member.id,
            }));
            if (!registered) {
              // A confirmed missing guild cannot have accepted the registration.
              if (!(await trpcNode.guild.getGuild.query({ id: guild.id })).guild) await channel.delete();
              throw error;
            }
          }
        }
        if (registered.id !== channel.id) await channel.delete();
        await newState.member.voice.setChannel(registered.id);
      } else {
        const { tempChannel } = await trpcNode.hub.getTempChannel.query({
          guildId: newState.guild.id,
          ownerId: newState.member.id,
        });
        if (!tempChannel) return;

        if (tempChannel.id === newState.channelId) return;

        await deleteRegisteredChannel(newState, tempChannel.id);
      }
    } else if (!newState.channelId) {
      // user left hub channel, delete his temp channel
      if (!oldState.member) return;
      const { tempChannel } = await trpcNode.hub.getTempChannel.query({
        guildId: oldState.guild.id,
        ownerId: oldState.member.id,
      });
      if (tempChannel) await deleteRegisteredChannel(oldState, tempChannel.id);
    }
  }
}

async function deleteRegisteredChannel(state: VoiceState, channelId: string) {
  try {
    const channel = await state.guild.channels.fetch(channelId);
    if (channel) await channel.delete();
  } catch (error) {
    // Discord can report that the tracked channel was already removed.
    if (!(error instanceof DiscordAPIError && error.code === 10003)) throw error;
  }
  await trpcNode.hub.deleteTempChannel.mutate({ channelId });
}
