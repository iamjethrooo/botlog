import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Args,
  Command,
  CommandOptions,
  container,
} from "@sapphire/framework";
import { CommandInteraction, Message, EmbedBuilder, TextChannel } from "discord.js";
import { trpcNode } from "../../trpc";
// import { trpcNode } from "../../trpc";

async function startHoldup(client, message, embed, redColor) {
  // Check if user is initiator
  if (message.member!.id == client.holdupLeader) {
    client.holdupIsOngoing = true;
  } else {
    embed
      .setAuthor({
        name: `${message.author.username}`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setDescription(
        `❌ Only <@${client.holdupLeader}> can start the holdup before 10 minutes is up.`
      )
      .setColor(`#${redColor}`)
      .setFooter(null);
    await message.channel.send({ embeds: [embed] });
  }
}

async function joinHoldup(client, message, embed, greenColor, redColor) {

  if (client.holdupMembers.includes(message.member!.id)) {
    embed
      .setAuthor({
        name: `${message.author.username}`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setDescription(`❌ You have already joined the holdup.`)
      .setColor(`#${redColor}`)
      .setFooter(null);
    await message.channel.send({ embeds: [embed] });
  } else if (message.member!.id == client.holdupVictim) {
    embed
      .setAuthor({
        name: `${message.author.username}`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setDescription(`❌ You can't participate in a holdup against yourself.`)
      .setColor(`#${redColor}`)
      .setFooter(null);
    await message.channel.send({ embeds: [embed] });
  }
  else {
    // Check member count
    embed
      .setAuthor({
        name: `${message.author.username}`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setDescription(`✅ You joined the holdup.`)
      .setColor(`#${greenColor}`)
      .setFooter(null);
    await message.channel.send({ embeds: [embed] });
    client.holdupMembers.push(message.member!.id);
  }
}

@ApplyOptions<CommandOptions>({
  name: "holdup",
  description: "Pull a holdup.",
  preconditions: ["inBotChannel", "isNotInmate"],
})
export class HoldupCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) { }

  public override async messageRun(message: Message, args: Args) {
    const { client } = container;
    let argument = await args.pick("string").catch(() => "");

    const holdupWaitingTime = await trpcNode.setting.getByKey.mutate({
      key: "holdupWaitingTime",
    });
    const holdupMaxMembers = await trpcNode.setting.getByKey.mutate({
      key: "holdupMaxMembers",
    });
    const holdupAdditionalRate = await trpcNode.setting.getByKey.mutate({
      key: "holdupAdditionalRate",
    });
    const holdupBaseRate = await trpcNode.setting.getByKey.mutate({
      key: "holdupBaseRate",
    });
    const holdupAdditionalChance = await trpcNode.setting.getByKey.mutate({
      key: "holdupAdditionalChance",
    });
    const holdupBaseChance = await trpcNode.setting.getByKey.mutate({
      key: "holdupBaseChance",
    });
    const holdupCooldown = Number(
      await trpcNode.setting.getByKey.mutate({
        key: "holdupCooldown",
      })
    );
    const greenColor = await trpcNode.setting.getByKey.mutate({
      key: "greenColor",
    });
    const redColor = await trpcNode.setting.getByKey.mutate({
      key: "redColor",
    });
    const coinEmoji = await trpcNode.setting.getByKey.mutate({
      key: "coinEmoji",
    });

    let holdupRate = Number(holdupBaseRate);
    let chance = Number(holdupBaseChance);
    let success;

    const embed = new EmbedBuilder().setAuthor({
      name: `${message.author.username}`,
      iconURL: message.author.displayAvatarURL(),
    });

    try {
      let lastHoldup = await trpcNode.holdupLog.getLastHoldup.query({
        suspectId: message.member!.id,
      })

      let lastHoldupDate = Number(lastHoldup.lastHoldup?.timestamp);
      let tooSoon = (Date.now() - lastHoldupDate) / 1000 < holdupCooldown;

      if (tooSoon) {
        embed.setDescription(
          `⏲️ Too soon. You can attempt another holdup <t:${Math.round(lastHoldupDate / 1000) + holdupCooldown
          }:R>`
        );
        embed.setColor(`#${redColor}`);

        return await (message.channel as TextChannel).send({ embeds: [embed] });
      }
      // If no holdup is ongoing, start a new holdup
      let noOngoingHoldup = !client.intervals["holdup"];
      if (noOngoingHoldup) {
        let hasNoMention = message.mentions.users.size < 1;
        if (hasNoMention) return;

        let victimId = message.mentions.users!.first()!.id;

        if (victimId == message.member!.id) return;

        client.holdupVictim = victimId;
        let lastTimeVictimWasHeldup = await trpcNode.holdupLog.getLastTimeHeldup.query({
          victimId: victimId
        });

        let holdupProtectionWindow = 12 * 60 * 60 * 1000; // 6 hours
        if (lastTimeVictimWasHeldup.lastTimeHeldup) {
          let msSinceLastSuccessfulRobAgainstVictim = Date.now() - lastTimeVictimWasHeldup.lastTimeHeldup!.timestamp.getTime();
          if (msSinceLastSuccessfulRobAgainstVictim < holdupProtectionWindow) {

            embed.setDescription(
              `❌ <@${victimId}> was held up recently. Try again <t:${Math.floor((lastTimeVictimWasHeldup.lastTimeHeldup!.timestamp.getTime() + holdupProtectionWindow) / 1000)}:R>`
            );
            embed.setColor(`#${redColor}`);
            await (message.channel as TextChannel).send({ embeds: [embed] });
            return;
          }
        }
        // Reset variables
        client.holdupLeader = "";
        client.holdupMembers = [];
        client.holdupIsOngoing = false;

        // Check for holdup cooldown
        // Start holdup
        client.timestamps["holdup"] = Date.now().toString();
        client.holdupMembers.push(message.member!.id);
        client.holdupLeader = message.member!.id;
        embed
          .setDescription(
            `A holdup is starting against <@${victimId}>!\n\nTo start the holdup, use the command \`bbc holdup start\`.\nTo join the holdup, use the command \`bbc holdup join\`.`
          )
          .setAuthor({
            name: `${message.author.username}`,
            iconURL: message.author.displayAvatarURL(),
          })
          .setColor(message.member!.displayHexColor)
          .setFooter({ text: "Time remaining: 5 minutes or 5 members" });
        await (message.channel as TextChannel).send({ embeds: [embed] });

        client.intervals["holdup"] = setInterval(async () => {
          if (
            client.holdupIsOngoing ||
            (Date.now() - Number(client.timestamps["holdup"])) / 1000 >
            Number(holdupWaitingTime) ||
            client.holdupMembers.length >= Number(holdupMaxMembers)
          ) {
            client.holdupIsOngoing = false;
            // Reset variables
            clearTimeout(client.intervals["holdup"]);
            delete client.intervals["holdup"];
            delete client.timestamps["holdup"];
            // Start holdup
            holdupRate +=
              Number(holdupAdditionalRate) * (client.holdupMembers.length - 1);
            chance +=
              Number(holdupAdditionalChance) * (client.holdupMembers.length - 1);

            success = Math.random() <= chance;

            let victim = await trpcNode.user.getUserById.query({
              id: victimId,
            });
            let victimCash = victim.user!.cash;
            let robAmount = Math.round(victimCash * holdupRate);
            // let robAmount = client.holdupMembers.length * 1000;
            let splitAmount = 0;
            if (success) {
              embed
                .setDescription(`✅ The holdup was a success!`)
                .setColor(`#${greenColor}`)
                .setFooter(null);
              await (message.channel as TextChannel).send({ embeds: [embed] });
              let splitMessage = ``;
              splitAmount = Math.round(
                robAmount / client.holdupMembers.length
              );
              client.holdupMembers.forEach(async (member) => {
                splitMessage += `<@${member}> got ${coinEmoji}${splitAmount}\n`;
                await trpcNode.user.addCash.mutate({
                  id: String(member),
                  cash: splitAmount,
                });
              });
              await trpcNode.user.subtractCash.mutate({
                id: victimId,
                cash: robAmount,
              });
              embed
                .setAuthor(null)
                .setTitle(`Holdup Results`)
                .setDescription(
                  `A total of ${coinEmoji}${robAmount} was stolen from <@${victimId}>.\n\n${splitMessage}`
                );
              await (message.channel as TextChannel).send({ embeds: [embed] });
            } else {
              embed
                .setDescription(`❌ The holdup failed.`)
                .setColor(`#${redColor}`)
                .setFooter(null);
              await (message.channel as TextChannel).send({ embeds: [embed] });
              let splitMessage = ``;
              let totalPenalty = 0;

              for (const member of client.holdupMembers) {
                try {
                  const suspect = await trpcNode.user.getUserById.query({
                    id: String(member),
                  });
                  const suspectCash = suspect.user!.cash;
                  const penalty = Math.round(suspectCash * holdupRate);
                  totalPenalty += penalty;
                  splitMessage += `<@${member}> lost ${coinEmoji}${penalty}\n`;
                } catch (err) {
                  console.error(`Failed to process member ${member}:`, err);
                }
              }

              embed
                .setAuthor(null)
                .setTitle(`Holdup Results`)
                .setDescription(
                  `${splitMessage}`
                );
              await (message.channel as TextChannel).send({ embeds: [embed] });
              await trpcNode.user.addCash.mutate({
                id: victimId,
                cash: totalPenalty,
              });
            }
            await trpcNode.holdupLog.create.mutate({
              leaderId: String(client.holdupLeader),
              victimId,
              participants: client.holdupMembers.map(s => s.toString()),
              success,
              totalLoot: splitAmount,
            });

            clearInterval(client.intervals["holdup"]);
          }
        }, 1000);
        return;
      }
      if (argument.toLocaleLowerCase() == "join") {
        joinHoldup(client, message, embed, greenColor, redColor);
      } else if (argument.toLocaleLowerCase() == "start") {
        startHoldup(client, message, embed, redColor);
      }
    } catch (error) {
      console.log(error);
    }
    return;
  }

  public override registerApplicationCommands(
    registery: ApplicationCommandRegistry
  ): void {
    registery.registerChatInputCommand({
      name: this.name,
      description: this.description,
    });
  }
}
