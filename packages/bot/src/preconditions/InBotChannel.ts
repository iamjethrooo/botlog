import { ApplyOptions } from "@sapphire/decorators";
import {
  Precondition,
  PreconditionOptions,
  PreconditionResult,
} from "@sapphire/framework";
import type { CommandInteraction, Message } from "discord.js";

const botChannels = [
  "682838969179832423",
  "1064926572680847490",
  "794833126270566411",
  "794833143113973760",
  "738754900992721028",
  "993892178893996032",
  "796684897594769418",
  "670801689770590208",
  "674518870211559428",
  "674860915383992340",
  "725110364773154896",
  "848135530197942282", // dev 1
  "1075950131347738815", // dev 2
  "735417877632647208", // bbc bot channel
  "677886889994223627", // office chat
  "737663525266391040", // server chat
  "838582160721575936", // lounge chat
];

@ApplyOptions<PreconditionOptions>({
  name: "inBotChannel",
})
export class inBotChannel extends Precondition {
  public override chatInputRun(
    interaction: CommandInteraction
  ): PreconditionResult {
    if (!botChannels.includes(interaction.channel!.id)) {
      return this.error({
        message: "You cannot use this command in this channel!",
      });
    }
    return this.ok();
  }

  public override async messageRun(message: Message): Promise<any> {
    if (!botChannels.includes(message.channel.id)) {
      return this.error({ message: "You cannot use this command in this channel!" });
    } else {
      return this.ok();
    }
  }
}

declare module "@sapphire/framework" {
  export interface Preconditions {
    inBotChannel: never;
  }
}
