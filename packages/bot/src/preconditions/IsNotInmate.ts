import { ApplyOptions } from "@sapphire/decorators";
import { Precondition, PreconditionOptions } from "@sapphire/framework";
import {
  CommandInteraction,
  GuildMember,
  Message,
  EmbedBuilder,
} from "discord.js";
import { trpcNode } from "../trpc";

@ApplyOptions<PreconditionOptions>({
  name: "isNotInmate",
})
export class isNotInmate extends Precondition {
  public override async chatInputRun(
    interaction: CommandInteraction
  ): Promise<any> {
    const roleIdInmate = await trpcNode.setting.getByKey.mutate({
      key: "roleIdInmate",
    });
    let isInmate = (<GuildMember>interaction.member)!.roles.cache.has(
      `${roleIdInmate}`
    );
    if (isInmate) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${interaction.user.username}#${interaction.user.discriminator}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setDescription("You cannot use this command while serving jail time!")
        .setColor((<GuildMember>interaction.member)!.displayHexColor);

      await interaction.channel!.send({ embeds: [embed] });
      return this.error({
        message: "You cannot use this command while serving jail time!",
      });
    }
    return this.ok();
  }
  public override async messageRun(message: Message): Promise<any> {
    const roleIdInmate = await trpcNode.setting.getByKey.mutate({
      key: "roleIdInmate",
    });
    let isInmate = message.member!.roles.cache.has(`${roleIdInmate}`);
    if (isInmate) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${message.author.username}#${message.author.discriminator}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setDescription("You cannot use this command while serving jail time!")
        .setColor(message.member!.displayHexColor);

      await message.channel.send({ embeds: [embed] });
      return this.error({
        message: "You cannot use this command while serving jail time!",
      });
    } else {
      return this.ok();
    }
  }
}

declare module "@sapphire/framework" {
  export interface Preconditions {
    isNotInmate: never;
  }
}
