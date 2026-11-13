import { ApplyOptions } from "@sapphire/decorators";
import { Listener, ListenerOptions, container } from "@sapphire/framework";
import { type Client, type TextChannel } from "discord.js";
import { trpcNode } from "../trpc";
import { completeGiveaway } from "../lib/giveawayCompletion";
import { giveawayChannel } from "../lib/giveawayLocation";
import * as fs from "fs";
import { topicFile } from '../lib/topicState';
import { setInterval } from '../lib/lifecycle';

const retryDelay = 30_000;

@ApplyOptions<ListenerOptions>({
  once: true,
  event: "ready",
})
export class ReadyListener extends Listener {
  public override async run(client: Client) {
    const extendedClient = container.client;
    const { username, id } = client.user!;
    console.log(`Successfully logged in as ${username} (${id})`);

    // Fetch specified guild
    const guild = await client.guilds.fetch(String(process.env.GUILD_ID));
    console.log("Fetched guild");
    await guild.members.fetch({ withPresences: true });
    console.log("Fetched presences");
    await guild.roles.fetch();
    console.log("Fetched roles");

    const roleIdInmate = await trpcNode.setting.getByKey.mutate({
      key: "roleIdInmate",
    });
    console.log(`Fetched Inmate ID: ${roleIdInmate}`);

    const inmateChecks = new Map<string, { at: number }>();
    client.on("guildMemberUpdate", (oldMember, member) => {
      if (member.guild.id === guild.id && roleIdInmate &&
          oldMember.roles.cache.has(roleIdInmate) !== member.roles.cache.has(roleIdInmate)) {
        inmateChecks.delete(member.id);
      }
    });

    let lastExecutionTime = 1789723417000;
    //await guild.members.fetch();
    //console.log("Fetched guild members");

    for (const giveaway of await trpcNode.giveaway.getActive.query()) {
      if (!extendedClient.activeGiveaways.has(giveaway.giveawayId)) {
        const endsAt = Number(giveaway.endsAtTimestamp ?? giveaway.endsAt);
        extendedClient.activeGiveaways.set(giveaway.giveawayId, Number.isSafeInteger(endsAt) ? endsAt : 0);
      }
    }

    let running = false;
    extendedClient.intervals.reliability = setInterval(async () => {
      if (running) return;
      running = true;
      try {
        // console.log("Inside interval");
        // #region Topics
        const currentTime = Date.now();
        //console.log(currentTime);

        const inmateRole = guild.roles.cache.get(String(roleIdInmate));
        const inmates = inmateRole?.members;
        for (const inmate of inmateChecks.keys()) {
          if (!inmates?.has(inmate)) inmateChecks.delete(inmate);
        }
        for (const inmate of inmates?.keys() ?? []) {
          let check = inmateChecks.get(inmate);
          if (check && currentTime < check.at) continue;
          if (!check) {
            check = { at: 0 };
            inmateChecks.set(inmate, check);
          }
          try {
            const { user } = await trpcNode.user.getUserById.query({ id: inmate });
            const member = inmateRole?.members.get(inmate);
            if (!inmateRole || !member || inmateChecks.get(inmate) !== check) continue;
            const releaseAt = Number(user?.lastHeistAt ?? user?.lastHeistDate) + Number(user?.jailDurationSeconds ?? user?.jailTime) * 1000;
            if (!Number.isFinite(releaseAt)) {
              throw new Error("Missing or invalid jail deadline");
            }
            if (Date.now() <= releaseAt) {
              check.at = Math.floor(releaseAt) + 1;
              continue;
            }
            await member.roles.remove(inmateRole);
            check.at = Date.now() + retryDelay;
          } catch (error) {
            check.at = Date.now() + retryDelay;
            console.error(`Inmate release failed (${inmate})`, error);
          }
        }
        // lastExecutionTime + minutes * 60 * 1000;
        const nextExecutionTime = lastExecutionTime + 180 * 60 * 1000; // 30 minutes in milliseconds
        // console.log("Current Time: " + currentTime);
        // console.log("Next Execution Time: " + nextExecutionTime);
        try {
          if (currentTime >= nextExecutionTime) {
            // if (false) {
            lastExecutionTime = currentTime;
            // dev 1223433266686595154
            // prod 669193383503200266
            const targetChannel = client.channels.cache.get(
              String(process.env.GENERAL_CHANNEL_ID)
            );
            // fs.readFile(
            //   path.join(__dirname, "../../src/resources/other/topics.txt"),
            //   "utf8",
            //   (err, content) => {
            //     if (err) {
            //       console.error("Error reading the file: ", err);
            //     }
            //     const lines = content
            //       .split("\n")
            //       .filter((line) => line.trim() !== "");
            //     // console.log(content);
            //     const randomIndex = Math.floor(Math.random() * lines.length);
            //     const randomLine = lines[randomIndex];
            //     (<TextChannel>targetChannel).send(randomLine);
            //   }
            // );
            let topic = getRandomTopicAndRemove();

            if (!topic) {
              console.log("Nothing to send, boss.");
            } else {
              await (<TextChannel>targetChannel).send(topic);
            }
          }
        } catch (error) {
          console.error("Scheduled topic failed", error);
        }
        // #endregion

        // #region Giveaway
        for (const [giveawayId, checkAt] of [...extendedClient.activeGiveaways]) {
          if (Date.now() < checkAt) continue;
          try {
            const giveaway = await trpcNode.giveaway.getById.mutate({ giveawayId });
            if (giveaway && !giveaway.ended) {
              const endsAt = Number(giveaway.endsAtTimestamp ?? giveaway.endsAt);
              if (!Number.isSafeInteger(endsAt) || endsAt <= 0) throw Error("Invalid giveaway end time");
              if (Date.now() < endsAt) {
                extendedClient.activeGiveaways.set(giveawayId, endsAt);
                continue;
              }
              await completeGiveaway(giveaway, await giveawayChannel(client, giveaway));
            }
            extendedClient.activeGiveaways.delete(giveawayId);
          } catch (error) {
            extendedClient.activeGiveaways.set(giveawayId, Date.now() + retryDelay);
            console.error(`Scheduled giveaway failed (${giveawayId})`, error);
          }
        }
        // #endregion
      } catch (error) {
        console.error("Scheduled tick failed", error);
      } finally {
        running = false;
      }
    }, 1000);
    (extendedClient as import('../structures/ExtendedClient').ExtendedClient).startupReady = true;
  }
}

function getRandomTopicAndRemove() {
  const FILE = topicFile();
  const TEMP = FILE + '.tmp';
  if (!fs.existsSync(FILE)) {
    console.log("topics.txt not found");
    return null;
  }

  const data = fs.readFileSync(FILE, "utf8").trim();

  if (!data) {
    console.log("No topics left.");
    return null;
  }

  const lines = data.split("\n").filter(Boolean);

  const index = Math.floor(Math.random() * lines.length);
  const topic = lines[index];

  lines.splice(index, 1);

  fs.writeFileSync(TEMP, lines.join("\n"), "utf8");
  fs.renameSync(TEMP, FILE);

  return topic;
}
