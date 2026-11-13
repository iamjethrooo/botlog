import { setTimeout } from '../lib/lifecycle';
import { ApplyOptions } from "@sapphire/decorators";
import { Listener, ListenerOptions, container } from "@sapphire/framework";
import type { Presence } from "discord.js";
@ApplyOptions<ListenerOptions>({
  event: "presenceUpdate",
})
export class PresenceUpdateListener extends Listener {
  private timer?: ReturnType<typeof setTimeout>;
  private running = false;
  private pending = false;

  public override run(oldPresence: Presence | null, newPresence: Presence) {
    if (newPresence.guild?.id !== String(process.env.GUILD_ID)) return;
    this.pending = true;
    this.schedule();
  }

  private schedule() {
    if (this.timer || this.running) return;
    // Fixed window rather than trailing debounce: sustained traffic cannot starve updates.
    this.timer = setTimeout(async () => {
      this.timer = undefined;
      this.running = true;
      this.pending = false;
      try {
        const guild = await container.client.guilds.fetch(
          String(process.env.GUILD_ID)
        );
        const channel = guild.channels.cache.get("1190145789591310386");
        if (!channel || !("setName" in channel))
          throw new Error("Online count channel unavailable");
        const name = `Online: ${countOnlineUsers(guild)}`;
        if (channel.name !== name) await channel.setName(name);
      } catch (error) {
        console.error("Presence count update failed", error);
        this.pending = true;
      } finally {
        this.running = false;
        if (this.pending) this.schedule();
      }
    }, 5000);
  }
}

function countOnlineUsers(guild) {
  // Preserve legacy semantics: online humans plus ALL idle/dnd members (including bots).
  return guild.members.cache.filter((member) => {
    return (
      (!member.user.bot && member.presence?.status == "online") ||
      member.presence?.status == "idle" ||
      member.presence?.status == "dnd"
    );
  }).size;
}
