import { ApplyOptions } from "@sapphire/decorators";
import { Precondition, PreconditionOptions } from "@sapphire/framework";
import {
  CommandInteraction,
  GuildMember,
  Message,
  EmbedBuilder,
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
      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${interaction.user.username}#${interaction.user.discriminator}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setDescription("You can only use this command while serving jail time.")
        .setColor((<GuildMember>interaction.member)!.displayHexColor);

      await interaction.channel!.send({ embeds: [embed] });
      return this.error({
        message: "You can only use this command while serving jail time.",
      });
    }
    return this.ok();
  }
  public override async messageRun(message: Message): Promise<any> {
    let isInmate = message.member!.roles.cache.has(
      `${process.env.ROLE_ID_INMATE}`
    );
    if (!isInmate) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${message.author.username}#${message.author.discriminator}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setDescription("You can only use this command while serving jail time.")
        .setColor(message.member!.displayHexColor);

      await message.channel.send({ embeds: [embed] });
      return this.error({
        message: "You can only use this command while serving jail time.",
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
