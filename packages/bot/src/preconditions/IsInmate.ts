import { ApplyOptions } from "@sapphire/decorators";
import { Precondition, PreconditionOptions } from "@sapphire/framework";
import {
  CommandInteraction,
  GuildMember,
  Message,
  MessageEmbed,
} from "discord.js";

@ApplyOptions<PreconditionOptions>({
  name: "isInmate",
})
export class isNotInmate extends Precondition {
  public override async chatInputRun(
    interaction: CommandInteraction
  ): Promise<any> {
    let isInmate = (<GuildMember>interaction.member)!.roles.cache.has(
      `${process.env.ROLE_ID_INMATE}`
    );
    if (!isInmate) {
      const embed = new MessageEmbed()
        .setAuthor(
          `${interaction.user.username}#${interaction.user.discriminator}`,
          interaction.user.displayAvatarURL({ dynamic: true })
        )
        .setDescription("You can only use this command in prison.")
        .setColor((<GuildMember>interaction.member)!.displayHexColor);

      await interaction.channel!.send({ embeds: [embed] });
      return this.error({
        message: "You can only use this command in prison.",
      });
    }
    return this.ok();
  }
  public override async messageRun(message: Message): Promise<any> {
    let isInmate = message.member!.roles.cache.has(
      `${process.env.ROLE_ID_INMATE}`
    );
    if (!isInmate) {
      const embed = new MessageEmbed()
        .setAuthor(
          `${message.author.username}#${message.author.discriminator}`,
          message.author.displayAvatarURL({ dynamic: true })
        )
        .setDescription("You can only use this command in prison.")
        .setColor(message.member!.displayHexColor);

      await message.channel.send({ embeds: [embed] });
      return this.error({
        message: "You can only use this command in prison.",
      });
    } else {
      return this.ok();
    }
  }
}

declare module "@sapphire/framework" {
  export interface Preconditions {
    isInmate: never;
  }
}
