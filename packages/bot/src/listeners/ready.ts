import { ApplyOptions } from "@sapphire/decorators";
import { Listener, ListenerOptions } from "@sapphire/framework";
import type { Client, TextChannel } from "discord.js";
import { trpcNode } from "../trpc";
import * as fs from "fs";
import * as path from "path";

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
    // client.application?.commands.set([], String(process.env.GUILD_ID));

    let lastExecutionTime = 0;
    await guild.members.fetch();
    setInterval(async () => {
      const currentTime = Date.now();

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

      const nextExecutionTime = lastExecutionTime + 30 * 60 * 1000; // 30 minutes in milliseconds
      if (currentTime >= nextExecutionTime) {

        lastExecutionTime = currentTime;
        let minutes = Date.now() / (60 * 1000);
        let remainder = minutes % 30;
        if (Math.abs(remainder - 30) <= 2 || remainder <= 2) {
          const targetChannel = client.channels.cache.get("669193383503200266");
          fs.readFile(
            path.join(__dirname, "../../src/resources/other/topics.txt"),
            "utf8",
            (err, content) => {
              if (err) {
                console.error("Error reading the file: ", err);
              }
              const lines = content
                .split("\n")
                .filter((line) => line.trim() !== "");

              const randomIndex = Math.floor(Math.random() * lines.length);
              const randomLine = lines[randomIndex];
              (<TextChannel>targetChannel).send(randomLine);
            }
          );
        }
      }
    }, 1000);
  }
}
