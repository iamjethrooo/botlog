import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import {
  CommandInteraction,
  EmbedBuilder,
  GuildMember,
  Message,
} from "discord.js";
import { trpcNode } from "../../trpc";

async function cooldown(member: GuildMember) {
  let userId = member.id;
  let user = await trpcNode.user.getUserById.query({
    id: userId,
  });
  const robCooldown = Number(
    await trpcNode.setting.getByKey.mutate({
      key: "robCooldown",
    })
  );
  const heistCooldown = Number(
    await trpcNode.setting.getByKey.mutate({
      key: "heistCooldown",
    })
  );
  const roleIdInmate = await trpcNode.setting.getByKey.mutate({
    key: "roleIdInmate",
  });

  const embed = new EmbedBuilder().setAuthor({
    name: `${member.user.username}#${member.user.discriminator}`,
    iconURL: member.displayAvatarURL(),
  });
  let lastRobDate = Number(user.user!.lastRobDate);

  let lastHeistDate = Number(user.user!.lastHeistDate);

  let canRob = (Date.now() - lastRobDate) / 1000 > robCooldown;
  let canHeist = (Date.now() - lastHeistDate) / 1000 > heistCooldown;
  let isInmate = (<GuildMember>member)!.roles.cache.has(`${roleIdInmate}`);
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
              Math.round(lastHeistDate / 1000) + Number(user.user?.jailTime)
            }:R>`
          : ""
      }`
    )
    .setColor((<GuildMember>member)!.displayHexColor);

  return embed;
}

@ApplyOptions<CommandOptions>({
  name: "cooldown",
  aliases: ["cd"],
  description: "View your cooldowns.",
  preconditions: ["inBotChannel"],
})
export class CooldownCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    try {
      let resultEmbed = await cooldown(<GuildMember>interaction.member);
      return await interaction.reply({ embeds: [resultEmbed] });
    } catch (error) {
      console.log(error);
      return;
    }
  }

  public override async messageRun(message: Message) {
    try {
      let resultEmbed = await cooldown(<GuildMember>message.member);
      return await message.channel.send({ embeds: [resultEmbed] });
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
