import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "cooldown",
  aliases: ["cd"],
  description: "View your cooldowns.",
  preconditions: ["inBotChannel"],
})
export class CooldownCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message) {
    let suspectId = message.author.id;
    let isThief = message.member!.roles.cache.has(
      `${process.env.ROLE_ID_THIEF}`
    );

    try {
      let suspect = await trpcNode.user.getUserById.query({
        id: suspectId,
      });

      let lastRobDate = Number(suspect.user!.lastRobDate);
      let robCooldown = isThief
        ? Number(process.env.ROB_COOLDOWN_THIEF)
        : Number(process.env.ROB_COOLDOWN);

      const embed = new MessageEmbed().setAuthor(
        `${message.author.username}#${message.author.discriminator}`,
        message.author.displayAvatarURL({ dynamic: true })
      );

      let canRob = (Date.now() - lastRobDate) / 1000 > robCooldown;

      embed.setDescription(
        `⏲️ You can attempt to rob another member ${
          canRob
            ? "`now`"
            : `in <t:${Math.round(lastRobDate / 1000) + robCooldown}:R>`
        }.`
      );
      embed.setColor(`#${process.env.RED_COLOR}`);

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
