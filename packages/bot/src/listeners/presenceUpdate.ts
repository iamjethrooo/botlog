import { ApplyOptions } from "@sapphire/decorators";
import { Listener, ListenerOptions, container } from "@sapphire/framework";
import type { Presence } from "discord.js";
@ApplyOptions<ListenerOptions>({
  event: "presenceUpdate",
})
export class PresenceUpdateListener extends Listener {
  public override async run(oldPresence: Presence, newPresence: Presence) {
    const { client } = container;
    const guild = await client.guilds.fetch(String(process.env.GUILD_ID));
    guild.channels.cache
    // airport 1190141457059811388
    // bbc 1190145789591310386
      .get("1190145789591310386")!
      .setName(`Online: ${countOnlineUsers(guild)}`);
  }
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
