import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import type { CommandInteraction, Message } from "discord.js";
// import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "rob",
  description: "Rob another user.",
  preconditions: [
    'inBotChannel'
  ]
})
export class RobCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message) {
    // if (message.mentions.users.size < 1) {
    //   return;
    // }
    // let victimId = message.mentions.users!.first()!.id;
    // let suspectId = message.author.id;
    // try {
    //   // Check if user exists in database
    //   let victim = await trpcNode.user.getUserById.query({
    //     id: victimId,
    //   });

    //   let suspect = await trpcNode.user.getUserById.query({
    //     id: suspectId,
    //   });


    // } catch (error) {
    //   console.log(error);
    //   return;
    // }
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
