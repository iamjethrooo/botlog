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
  TextChannel,
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
  const bodyguardDuration = await trpcNode.setting.getByKey.mutate({
    key: "bodyguardDuration",
  });
  const holdupCooldown = Number(
    await trpcNode.setting.getByKey.mutate({
      key: "holdupCooldown",
    })
  );

  const embed = new EmbedBuilder().setAuthor({
    name: `${member.user.username}`,
    iconURL: member.displayAvatarURL(),
  });
  let lastRobDate = Number(user.user!.lastRobDate);

  let lastHeistDate = Number(user.user!.lastHeistDate);

  const lastBodyguardDate = user.user?.lastBodyguardDate;
  const bodyguardUntil =
    Number(lastBodyguardDate) + Number(bodyguardDuration) * 1000;

  let lastHoldup = await trpcNode.holdupLog.getLastHoldup.query({
    suspectId: userId,
  })

  let lastHoldupDate = Number(lastHoldup.lastHoldup?.timestamp);

  let canRob = (Date.now() - lastRobDate) / 1000 > robCooldown;
  let canHeist = (Date.now() - lastHeistDate) / 1000 > heistCooldown;
  let isInmate = (<GuildMember>member)!.roles.cache.has(`${roleIdInmate}`);
  let canHoldup = (Date.now() - lastHoldupDate) / 1000 > holdupCooldown;
  console.log(`Last rob: ${Math.round(lastRobDate / 1000) + robCooldown}`);
  embed
    .setTitle("⏲️ Cooldowns")
    .setDescription(
      `• Rob: ${canRob || isNaN(lastRobDate)
        ? "`now`"
        : `<t:${Math.round(lastRobDate / 1000) + robCooldown}:R>`
      }\n• Holdup: ${canHoldup || isNaN(lastHoldupDate)
        ? "`now`"
        : `<t:${Math.round(lastHoldupDate / 1000) + holdupCooldown}:R>`
      }\n• Heist: ${canHeist || isNaN(lastHeistDate)
        ? "`now`"
        : `<t:${Math.round(lastHeistDate / 1000) + heistCooldown}:R>`
      }${bodyguardUntil > Date.now()
        ? `\n\nYou are protected from robberies until <t:${Math.round(bodyguardUntil / 1000)}:F>`
        : ""
      }
      ${isInmate
        ? `\n\nYou will be released from jail <t:${Math.round(lastHeistDate / 1000) + Number(user.user?.jailTime)
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
      await interaction.deferReply();
      let resultEmbed = await cooldown(<GuildMember>interaction.member);
      return await interaction.editReply({ embeds: [resultEmbed] });
    } catch (error) {
      console.log(error);
      return;
    }
  }

  public override async messageRun(message: Message) {
    try {
      let resultEmbed = await cooldown(<GuildMember>message.member);
      return await (message.channel as TextChannel).send({ embeds: [resultEmbed] });
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
