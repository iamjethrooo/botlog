import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Args,
  Command,
  CommandOptions,
  container,
} from "@sapphire/framework";
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { trpcNode } from "../../trpc";
// import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "heist",
  description: "Rob the server bank.",
  preconditions: ["inBotChannel", "isNotInmate"],
})
export class HeistCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message, args: Args) {
    const { client } = container;
    let argument = await args.pick("string").catch(() => "");
    const embed = new EmbedBuilder().setAuthor({
      name: `${message.author.username}#${message.author.discriminator}`,
      iconURL: message.author.displayAvatarURL(),
    });

    const heistWaitingTime = await trpcNode.setting.getByKey.mutate({
      key: "heistWaitingTime",
    });
    const heistMaxMembers = await trpcNode.setting.getByKey.mutate({
      key: "heistMaxMembers",
    });
    const heistReducedJailTime = await trpcNode.setting.getByKey.mutate({
      key: "heistReducedJailTime",
    });
    const heistJailTime = await trpcNode.setting.getByKey.mutate({
      key: "heistJailTime",
    });
    const heistAdditionalRate = await trpcNode.setting.getByKey.mutate({
      key: "heistAdditionalRate",
    });
    const heistBaseRate = await trpcNode.setting.getByKey.mutate({
      key: "heistBaseRate",
    });
    const heistAdditionalChance = await trpcNode.setting.getByKey.mutate({
      key: "heistAdditionalChance",
    });
    const heistBaseChance = await trpcNode.setting.getByKey.mutate({
      key: "heistBaseChance",
    });
    const heistCooldown = Number(
      await trpcNode.setting.getByKey.mutate({
        key: "heistCooldown",
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
    const roleIdInmate = await trpcNode.setting.getByKey.mutate({
      key: "roleIdInmate",
    });

    let guild = await trpcNode.guild.getGuild.query({
      id: message!.guildId!,
    });

    let robRate = Number(heistBaseRate);
    let robChance = Number(heistBaseChance);
    let success;
    try {
      let suspect = await trpcNode.user.getUserById.query({
        id: message.member!.id,
      });

      let lastRobDate = Number(suspect.user!.lastHeistDate);
      let tooSoon = (Date.now() - lastRobDate) / 1000 < heistCooldown;

      if (tooSoon) {
        embed.setDescription(
          `⏲️ Too soon. You can attempt another bank heist <t:${
            Math.round(lastRobDate / 1000) + heistCooldown
          }:R>`
        );
        embed.setColor(`#${redColor}`);

        return await message.channel.send({ embeds: [embed] });
      }
      // If no heist is ongoing, start a new heist
      let noOngoingHeist = !client.intervals["heist"];
      if (noOngoingHeist) {
        // Reset variables
        client.heistLeader = "";
        client.heistMembers = [];

        // Check for heist cooldown
        // Start heist
        client.timestamps["heist"] = Date.now().toString();
        client.heistMembers.push(message.member!.id);
        client.heistLeader = message.member!.id;
        embed
          .setDescription(
            `A bank heist is starting!\n\nTo start the heist, use the command \`bbc heist start\`.\nTo join the heist, use the command \`bbc heist join\`.`
          )
          .setAuthor({
            name: `${message.author.username}#${message.author.discriminator}`,
            iconURL: message.author.displayAvatarURL(),
          })
          .setColor(message.member!.displayHexColor)
          .setFooter({ text: "Time remaining: 10 minutes or 10 members" });
        await message.channel.send({ embeds: [embed] });

        client.intervals["heist"] = setInterval(async () => {
          if (
            client.heistIsOngoing ||
            (Date.now() - Number(client.timestamps["heist"])) / 1000 >
              Number(heistWaitingTime) ||
            client.heistMembers.length >= Number(heistMaxMembers)
          ) {
            // Reset variables
            clearTimeout(client.intervals["heist"]);
            delete client.intervals["heist"];
            // Start heist
            robRate +=
              Number(heistAdditionalRate) * (client.heistMembers.length - 1);
            robChance +=
              Number(heistAdditionalChance) * (client.heistMembers.length - 1);

            success = Math.random() <= robChance;

            client.heistMembers.forEach(async (member) => {
              await trpcNode.user.updateLastHeistDate.mutate({
                id: String(member),
                date: Date.now().toString(),
              });
            });

            let robAmount = Math.round(guild!.guild!.bank * robRate);
            // let robAmount = client.heistMembers.length * 1000;
            if (success) {
              embed
                .setDescription(`✅ The bank heist was a success!`)
                .setColor(`#${greenColor}`)
                .setFooter(null);
              await message.channel.send({ embeds: [embed] });
              let splitMessage = ``;
              let splitAmount = Math.round(
                robAmount / client.heistMembers.length
              );
              client.heistMembers.forEach(async (member) => {
                splitMessage += `<@${member}> got ${coinEmoji}${splitAmount}\n`;
                await trpcNode.user.addCash.mutate({
                  id: String(member),
                  cash: splitAmount,
                });
              });
              await trpcNode.guild.subtractFromBank.mutate({
                id: message!.guildId!,
                amount: robAmount,
              });
              embed
                .setAuthor(null)
                .setTitle(`Bank Heist Results`)
                .setDescription(
                  `A total of ${coinEmoji}${robAmount} was stolen from the bank.\n\n${splitMessage}`
                );
              await message.channel.send({ embeds: [embed] });
            } else {
              embed
                .setDescription(`❌ The bank heist failed.`)
                .setColor(`#${redColor}`)
                .setFooter(null);
              await message.channel.send({ embeds: [embed] });
              let splitMessage = ``;

              // Serve jail time for x hours
              let inmateRole = message!.guild!.roles.cache.find(
                (role) => role.id == roleIdInmate!
              );
              let jailTime =
                Number(heistJailTime) -
                Number(heistReducedJailTime) * (client.heistMembers.length - 1);
              client.heistMembers.forEach(async (member) => {
                splitMessage += `<@${member}> got caught.\n`;
                await trpcNode.user.setJailTime
                  .mutate({
                    id: String(member),
                    jailTime: String(jailTime),
                  })
                  .then(() => {
                    let user = message.guild!.members.cache.get(String(member));
                    user!.roles.add(inmateRole!);
                  });
              });
              embed
                .setAuthor(null)
                .setTitle(`Bank Heist Results`)
                .setDescription(
                  `${splitMessage}\nThey will serve jail time for ${
                    jailTime / 3600
                  } hours and will not be able to earn coins for the duration.`
                );
              await message.channel.send({ embeds: [embed] });
            }

            client.heistIsOngoing = false;
          }
        }, 1000);
        return;
      }
      if (argument.toLocaleLowerCase() == "join") {
        // Join heist
        // Check member count
        console.log("Joined heist");
        if (client.heistMembers.includes(message.member!.id)) {
          embed
            .setAuthor({
              name: `${message.author.username}#${message.author.discriminator}`,
              iconURL: message.author.displayAvatarURL(),
            })
            .setDescription(`❌ You have already joined the bank heist.`)
            .setColor(`#${redColor}`)
            .setFooter(null);
          await message.channel.send({ embeds: [embed] });
        } else {
          embed
            .setAuthor({
              name: `${message.author.username}#${message.author.discriminator}`,
              iconURL: message.author.displayAvatarURL(),
            })
            .setDescription(`✅ You joined the heist.`)
            .setColor(`#${greenColor}`)
            .setFooter(null);
          await message.channel.send({ embeds: [embed] });
          client.heistMembers.push(message.member!.id);
        }
      } else if (argument.toLocaleLowerCase() == "start") {
        // Check if user is initiator
        if (message.member!.id == client.heistLeader) {
          client.heistIsOngoing = true;
        } else {
          embed
            .setAuthor({
              name: `${message.author.username}#${message.author.discriminator}`,
              iconURL: message.author.displayAvatarURL(),
            })
            .setDescription(
              `❌ Only <@${client.heistLeader}> can start the heist before 10 minutes is up.`
            )
            .setColor(`#${redColor}`)
            .setFooter(null);
          await message.channel.send({ embeds: [embed] });
        }
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
