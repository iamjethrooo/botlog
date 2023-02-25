import { ApplyOptions } from "@sapphire/decorators";
import {
  Precondition,
  PreconditionOptions,
  PreconditionResult,
} from "@sapphire/framework";
import type { CommandInteraction, GuildMember, Message } from "discord.js";

@ApplyOptions<PreconditionOptions>({
  name: "userIsAdmin",
})
export class UserIsAdmin extends Precondition {
  public override chatInputRun(
    interaction: CommandInteraction
  ): PreconditionResult {
    if (!(<GuildMember>interaction.member)!.permissions.has("ADMINISTRATOR")) {
      return this.error({
        message: "You don't have permissions to use this command.",
      });
    }
    return this.ok();
  }

  public override async messageRun(message: Message): Promise<any> {
    if (!message.member!.permissions.has("ADMINISTRATOR")) {
      return this.error({
        message: "You don't have permissions to use this command.",
      });
    } else {
      return this.ok();
    }
  }
}

declare module "@sapphire/framework" {
  export interface Preconditions {
    userIsAdmin: never;
  }
}
