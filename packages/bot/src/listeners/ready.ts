import { ApplyOptions } from "@sapphire/decorators";
import { Listener, ListenerOptions, container } from "@sapphire/framework";
import {
  type Client,
  type TextChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { trpcNode } from "../trpc";
import * as fs from "fs";
import * as path from "path";

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
    await guild.members.fetch({ withPresences: true });
    await guild.roles.fetch();

    const roleIdInmate = await trpcNode.setting.getByKey.mutate({
      key: "roleIdInmate",
    });

    let inmateRole = guild.roles.cache.find(
      (role) => role.id == roleIdInmate!
    );

    let lastExecutionTime = 1710493200000;
    await guild.members.fetch();

    extendedClient.activeGiveaways = (
      await trpcNode.giveaway.getActive.query()
    ).map((giveaway) => {
      return giveaway.giveawayId;
    });

    setInterval(async () => {
      // #region Topics
      const currentTime = Date.now();
      //console.log(currentTime);

      let inmates = guild.roles.cache
        .get(String(roleIdInmate))
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
      // lastExecutionTime + minutes * 60 * 1000;
      const nextExecutionTime = lastExecutionTime + 180 * 60 * 1000; // 30 minutes in milliseconds
      if (currentTime >= nextExecutionTime) {
        lastExecutionTime = currentTime;
        // dev 1075950131347738815
        // prod 669193383503200266
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
      // #endregion

      // #region Giveaway
      extendedClient.activeGiveaways.forEach(async (giveawayId) => {
        const giveaway = await trpcNode.giveaway.getById.mutate({
          giveawayId: giveawayId.toString(),
        });
        if (Number(Date.now()) > Number(giveaway!.endsAt)) {
          // Get participants
          const entries = await trpcNode.giveaway.getEntries.mutate({
            giveawayId: giveawayId.toString(),
          });

          let entriesFiltered = entries.map((entry) => {
            return entry.userId;
          });
          shuffle(entriesFiltered);
          console.log(entriesFiltered);
          entriesFiltered = entriesFiltered.filter((entry) => {
            return entry != "496523098439548929";
          });
          console.log(entriesFiltered);
          // Pick winner
          let winners: string[] = [];
          for (let i = 0; i < giveaway!.numOfWinners; i++) {
            let random = Math.floor(Math.random() * entriesFiltered.length);
            let winnerId = entriesFiltered[random];
            winners.push(winnerId);
            entriesFiltered = entriesFiltered.filter((entry) => {
              return entry != winnerId;
            });
          }
          let winnerString = "";
          winners.forEach((winner) => {
            winnerString += `<@${winner}> `;
          });
          winnerString.trim();

          const giveawayChannel = <TextChannel>(
            client.channels.cache.get(String(process.env.GIVEAWAY_CHANNEL_ID))
          );

          giveawayChannel.messages
            .fetch(giveaway!.messageId)
            .then(async (message) => {
              let messageEmbed = message.embeds[0];
              let newEmbed = new EmbedBuilder()
                .setTitle(messageEmbed.title)
                .setColor(messageEmbed.color)
                .setDescription(
                  `Winner${
                    giveaway!.numOfWinners > 1 ? "s" : ""
                  }: ${winnerString}${
                    giveaway?.hostId == ""
                      ? ""
                      : `\n\nHosted by: <@${giveaway?.hostId}>`
                  }`
                )
                .setFooter({ text: "Ended: " })
                .setTimestamp();
              const participants =
                await trpcNode.giveaway.getParticipants.mutate({
                  giveawayId: String(giveaway?.giveawayId),
                });
              const buttons =
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                  new ButtonBuilder()
                    .setCustomId(`${giveaway!.giveawayId}-Join`)
                    .setLabel(`${participants.length}`)
                    .setEmoji("🎉")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
                  new ButtonBuilder()
                    .setCustomId(`${giveaway!.giveawayId}-Participants`)
                    .setLabel("Participants")
                    .setEmoji("👥")
                    .setStyle(ButtonStyle.Secondary)
                );

              const attachmentUrl =
                message.attachments.size > 0
                  ? message.attachments.first()!.url
                  : "";
              if (attachmentUrl == "") {
                message.edit({
                  content: "🎉Giveaway Ended🎉",
                  embeds: [newEmbed],
                  components: [buttons],
                });
              } else {
                message.edit({
                  content: "🎉Giveaway Ended🎉",
                  embeds: [newEmbed],
                  components: [buttons],
                  files: [{ attachment: attachmentUrl }],
                });
              }

              const winnerEmbed = new EmbedBuilder()
                .setColor("#546e7a")
                .setDescription(
                  `${winnerString} won the giveaway of [**${
                    giveaway!.prize
                  }**](${message.url})
                  
                  - Reroll Command: \`bbc reroll ${giveaway!.giveawayId}\``
                );

              winnerString = "Congratulations to " + winnerString + "!🎉";
              // Announce winner
              giveawayChannel.send({
                content: winnerString,
                embeds: [winnerEmbed],
              });
            });

          await trpcNode.giveaway.endGiveaway.mutate({
            giveawayId: giveawayId.toString(),
          });

          // Remove giveaway from active list
          const index = extendedClient.activeGiveaways.indexOf(giveawayId);
          extendedClient.activeGiveaways.splice(index, 1);
        }
      });
      // #endregion
    }, 1000);
  }
}

function shuffle(array: String[]) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}
