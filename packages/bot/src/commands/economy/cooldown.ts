import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import { CommandInteraction, GuildMember, Message, MessageEmbed } from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "cooldown",
  aliases: ["cd"],
  description: "View your cooldowns.",
  preconditions: ["inBotChannel"],
})
export class CooldownCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    let userId = interaction.user.id;
    let isThief = (<GuildMember>interaction.member)!.roles.cache.has(
      `${process.env.ROLE_ID_THIEF}`
    );

    try {
      let user = await trpcNode.user.getUserById.query({
        id: userId,
      });

      let lastRobDate = Number(user.user!.lastRobDate);
      let robCooldown = isThief
        ? Number(process.env.ROB_COOLDOWN_THIEF)
        : Number(process.env.ROB_COOLDOWN);

      let lastHeistDate = Number(user.user!.lastHeistDate);
      let heistCooldown = Number(process.env.HEIST_COOLDOWN);

      const embed = new MessageEmbed().setAuthor(
        `${interaction.user.username}#${interaction.user.discriminator}`,
        interaction.user.displayAvatarURL({ dynamic: true })
      );

      let canRob = (Date.now() - lastRobDate) / 1000 > robCooldown;
      let canHeist = (Date.now() - lastHeistDate) / 1000 > heistCooldown;
      let isInmate = (<GuildMember>interaction.member)!.roles.cache.has(
        `${process.env.ROLE_ID_INMATE}`
      );
      embed
        .setTitle("⏲️ Cooldowns")
        .setDescription(
          `• Rob: ${
            canRob
              ? "`now`"
              : `<t:${Math.round(lastRobDate / 1000) + robCooldown}:R>`
          }\n• Heist: ${
            canHeist
              ? "`now`"
              : `<t:${Math.round(lastHeistDate / 1000) + heistCooldown}:R>`
          }${
            isInmate
              ? `\n\nYou will be released from jail <t:${
                  Math.round(lastHeistDate / 1000) +
                  Number(user.user?.jailTime)
                }:R>`
              : ""
          }`
        )
        .setColor((<GuildMember>interaction.member)!.displayHexColor);

      return await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.log(error);
      return;
    }
  }

  public override async messageRun(message: Message) {
    let userId = message.author.id;
    let isThief = message.member!.roles.cache.has(
      `${process.env.ROLE_ID_THIEF}`
    );

    try {
      let user = await trpcNode.user.getUserById.query({
        id: userId,
      });

      let lastRobDate = Number(user.user!.lastRobDate);
      let robCooldown = isThief
        ? Number(process.env.ROB_COOLDOWN_THIEF)
        : Number(process.env.ROB_COOLDOWN);

      let lastHeistDate = Number(user.user!.lastHeistDate);
      let heistCooldown = Number(process.env.HEIST_COOLDOWN);

      const embed = new MessageEmbed().setAuthor(
        `${message.author.username}#${message.author.discriminator}`,
        message.author.displayAvatarURL({ dynamic: true })
      );

      let canRob = (Date.now() - lastRobDate) / 1000 > robCooldown;
      let canHeist = (Date.now() - lastHeistDate) / 1000 > heistCooldown;
      let isInmate = message.member!.roles.cache.has(
        `${process.env.ROLE_ID_INMATE}`
      );
      embed
        .setTitle("⏲️ Cooldowns")
        .setDescription(
          `• Rob: ${
            canRob
              ? "`now`"
              : `<t:${Math.round(lastRobDate / 1000) + robCooldown}:R>`
          }\n• Heist: ${
            canHeist
              ? "`now`"
              : `<t:${Math.round(lastHeistDate / 1000) + heistCooldown}:R>`
          }${
            isInmate
              ? `\n\nYou will be released from jail <t:${
                  Math.round(lastHeistDate / 1000) +
                  Number(user.user?.jailTime)
                }:R>`
              : ""
          }`
        )
        .setColor(message.member!.displayHexColor);

      return await message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.log(error);
      return;
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
