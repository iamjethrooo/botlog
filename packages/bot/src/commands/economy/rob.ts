import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "rob",
  description: "Rob another user.",
  preconditions: ["inBotChannel"],
})
export class RobCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message) {
    if (message.mentions.users.size < 1) {
      return;
    }
    let victimId = message.mentions.users!.first()!.id;
    let suspectId = message.author.id;
    try {
      // Check if user exists in database
      let suspect = await trpcNode.user.getUserById.query({
        id: suspectId,
      });

      let suspectCash = suspect.user!.cash;

      let lastRobDate = Number(suspect.user!.lastRobDate);
      let robCooldown = Number(process.env.ROB_COOLDOWN);
      const embed = new MessageEmbed().setAuthor(
        `${message.author.username}#${message.author.discriminator}`,
        message.author.displayAvatarURL({ dynamic: true })
      );

      if ((Date.now() - lastRobDate) / 1000 < robCooldown) {
        embed.setDescription(
          `⏲️ Too soon. You can attempt to rob another member in <t:${Math.round((lastRobDate / 1000)) + robCooldown}:R>`
        );
        embed.setColor(`#${process.env.RED_COLOR}`);

        return await message.channel.send({ embeds: [embed] });
      }

      let victim = await trpcNode.user.getUserById.query({
        id: victimId,
      });

      let victimCash = victim.user!.cash;

      let tenPercent = Math.round(victimCash * 0.1);

      let success = Math.random() <= Number(process.env.ROB_CHANCE);

      if (success) {
        await trpcNode.user.addCash.mutate({
          id: suspectId,
          cash: tenPercent,
        });

        await trpcNode.user.subtractCash.mutate({
          id: victimId,
          cash: tenPercent,
        });
        embed.setDescription(
          `✅ You robbed ${process.env.COIN_EMOJI}${tenPercent} from <@${victimId}>.`
        );
        embed.setColor(`#${process.env.GREEN_COLOR}`);
      } else {
        let amountToBeSubtracted = suspectCash > tenPercent ? tenPercent : suspectCash;

        await trpcNode.user.subtractCash.mutate({
          id: suspectId,
          cash: amountToBeSubtracted,
        });

        await trpcNode.guild.addToBank.mutate({
          id: message!.guildId!,
          amount: amountToBeSubtracted,
        });

        embed.setDescription(
          `❌ You were caught attempting to rob <@${victimId}> and have been fined ${process.env.COIN_EMOJI}${amountToBeSubtracted}.`
        );
        embed.setColor(`#${process.env.RED_COLOR}`);
      }

      await trpcNode.user.updateLastRobDate.mutate({
        id: message.author.id,
        date: Date.now().toString(),
      });

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
