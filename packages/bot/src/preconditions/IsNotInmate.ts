import { ApplyOptions } from "@sapphire/decorators";
import { Precondition, PreconditionOptions } from "@sapphire/framework";
import { Message, MessageEmbed } from "discord.js";

@ApplyOptions<PreconditionOptions>({
  name: "isNotInmate",
})
export class isNotInmate extends Precondition {
  public override async messageRun(message: Message): Promise<any> {
    let isInmate = message.member!.roles.cache.has(
      `${process.env.ROLE_ID_INMATE}`
    );
    if (isInmate) {
      const embed = new MessageEmbed()
        .setAuthor(
          `${message.author.username}#${message.author.discriminator}`,
          message.author.displayAvatarURL({ dynamic: true })
        )
        .setDescription("You cannot use this command while serving jail time!")
        .setColor(message.member!.displayHexColor);

      await message.channel.send({ embeds: [embed] });
      return this.error({ message: "User is inmate!" });
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
