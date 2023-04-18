import { ApplyOptions } from "@sapphire/decorators";
import { Listener, ListenerOptions } from "@sapphire/framework";
import type { Client } from "discord.js";
import { trpcNode } from "../trpc";

@ApplyOptions<ListenerOptions>({
  once: true,
  event: "ready",
})
export class ReadyListener extends Listener {
  public override async run(client: Client) {
    const { username, id } = client.user!;
    console.log(`Successfully logged in as ${username} (${id})`);

    // Fetch specified guild
    const guild = await client.guilds.fetch(String(process.env.GUILD_ID));
    await guild.members.fetch();
    await guild.roles.fetch();
    let inmateRole = guild.roles.cache.find(
      (role) => role.id == process.env.ROLE_ID_INMATE
    );
    client.application?.commands.set([], String(process.env.GUILD_ID));

    await guild.members.fetch();
    setInterval(async () => {
      let inmates = guild.roles.cache
        .get(String(process.env.ROLE_ID_INMATE))
        ?.members.map((member) => member.id);
      inmates?.forEach(async (inmate) => {
        let user = await trpcNode.user.getUserById.query({
          id: inmate,
        });
        let lastHeistDate = Number(user.user?.lastHeistDate);
        if ((Date.now() - lastHeistDate) / 1000 > Number(user.user?.jailTime)) {
          let member = guild.members.cache.get(inmate);
          member?.roles.remove(inmateRole!);
        }
      });
    }, 1000);
  }
}
