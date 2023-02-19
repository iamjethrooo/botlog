import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Args,
  Command,
  CommandOptions,
  container,
} from "@sapphire/framework";
import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import { trpcNode } from "../../trpc";
// import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "heist",
  description: "Rob the server bank.",
  preconditions: ["inBotChannel"],
})
export class HeistCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message, args: Args) {
    const { client } = container;
    let argument = await args.pick("string").catch(() => "");
    const embed = new MessageEmbed();

    let robRate = Number(process.env.HEIST_BASE_RATE);
    let robChance = Number(process.env.HEIST_BASE_CHANCE);
    let success;
    try {
      if (!client.intervals["heist"]) {
        // Reset variables
        client.heistLeader = "";
        client.heistMembers = [];
        client.heistIsOngoing = false;

        // Check for heist cooldown
        // Start heist
        client.timestamps["heist"] = Date.now().toString();
        client.heistMembers.push(message.member!.id);
        client.heistLeader = message.member!.id;
        embed
          .setDescription(
            `A bank heist has begun!\n\nTo start the heist, use the command \`bbc heist start\`.\nTo join the heist, use the command \`bbc heist join\`.`
          )
          .setAuthor(
            `${message.author.username}#${message.author.discriminator}`,
            message.author.displayAvatarURL({ dynamic: true })
          )
          .setColor(message.member!.displayHexColor)
          .setFooter("Time remaining: 3 minutes or 5 members");
        await message.channel.send({ embeds: [embed] });

        client.intervals["heist"] = setInterval(async () => {
          console.log(client.heistIsOngoing);
          if (
            client.heistIsOngoing ||
            (Date.now() - Number(client.timestamps["heist"])) / 1000 > 500 ||
            client.heistMembers.length >= Number(process.env.HEIST_MAX_MEMBERS)
          ) {
            // Reset variables
            clearTimeout(client.intervals["heist"]);
            delete client.intervals["heist"];
            // Start heist
            robRate +=
              Number(process.env.HEIST_ADDITIONAL_RATE) *
              (client.heistMembers.length - 1);
            robChance +=
              Number(process.env.HEIST_ADDITIONAL_CHANCE) *
              (client.heistMembers.length - 1);

            success = Math.random() <= robChance;
            let guild = await trpcNode.guild.getGuild.query({
              id: message!.guildId!,
            });

            let robAmount = Math.round(guild!.guild!.bank * robRate);

            if (success) {
              embed
                .setDescription(`✅ The bank heist was a success!`)
                .setColor(`#${process.env.GREEN_COLOR}`)
                .setFooter(null);
              await message.channel.send({ embeds: [embed] });
              let splitMessage = ``;
              let splitAmount = Math.round(
                robAmount / client.heistMembers.length
              );
              client.heistMembers.forEach(async (member) => {
                splitMessage += `<@${member}> got ${process.env.COIN_EMOJI}${splitAmount}\n`;
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
                  `A total of ${process.env.COIN_EMOJI}${robAmount} was stolen from the bank.\n\n${splitMessage}`
                );
              await message.channel.send({ embeds: [embed] });
            } else {
              embed
                .setDescription(`❌ The bank heist failed.`)
                .setColor(`#${process.env.RED_COLOR}`)
                .setFooter(null);
              await message.channel.send({ embeds: [embed] });
              let splitMessage = ``;

              client.heistMembers.forEach(async (member) => {
                splitMessage += `<@${member}> got caught.\n`;
              });
              embed
                .setAuthor(null)
                .setTitle(`Bank Heist Results`)
                .setDescription(
                  `${splitMessage}\nThey will serve jail time for 12 hours and will not be able to earn coins for the duration.`
                );
              await message.channel.send({ embeds: [embed] });
              // Serve jail time for x hours
              await message.guild!.roles.fetch();
              await message.guild!.members.fetch();
              let inmateRole = message!.guild!.roles.cache.find(
                (role) => role.id == process.env.ROLE_ID_INMATE
              );
              client.heistMembers.forEach((member) => {
                let user = message.guild!.members.cache.get(String(member));
                if (user) {
                  user.roles.add(inmateRole!);
                }
              });
            }
          }
        }, 1000);
      } else {
        if (argument.toLocaleLowerCase() == "join") {
          // Join heist
          // Check member count
          console.log("Joined heist");
          if (client.heistMembers.includes(message.member!.id)) {
            embed
              .setAuthor(
                `${message.author.username}#${message.author.discriminator}`,
                message.author.displayAvatarURL({ dynamic: true })
              )
              .setDescription(`❌ You have already joined the bank heist.`)
              .setColor(`#${process.env.RED_COLOR}`)
              .setFooter(null);
            await message.channel.send({ embeds: [embed] });
          } else {
            embed
              .setAuthor(
                `${message.author.username}#${message.author.discriminator}`,
                message.author.displayAvatarURL({ dynamic: true })
              )
              .setDescription(`✅ You joined the heist.`)
              .setColor(`#${process.env.GREEN_COLOR}`)
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
              .setAuthor(
                `${message.author.username}#${message.author.discriminator}`,
                message.author.displayAvatarURL({ dynamic: true })
              )
              .setDescription(
                `❌ Only <@${client.heistLeader}> can start the heist before 5 minutes is up.`
              )
              .setColor(`#${process.env.RED_COLOR}`)
              .setFooter(null);
            await message.channel.send({ embeds: [embed] });
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
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
