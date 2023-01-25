import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
  Args,
} from "@sapphire/framework";
import type { CommandInteraction, Message } from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "give",
  description: "Give coins to a user.",
})
export class GiveCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message, args: Args) {
    if (!message.member!.permissions.has("ADMINISTRATOR")) {
      return;
    }

    let amount = await args.pick("integer").catch(() => 0);
    // console.log(message.mentions);
    if (message.mentions.users.size == 1) {
      console.log(message.mentions.users!.first()!.id);
      let id = message.mentions.users!.first()!.id;
      try {
        // Check if user exists in database
        let user = await trpcNode.user.getUserById.query({
          id: id,
        });

        if (user.user == null) {
          await trpcNode.user.create.mutate({
            id: id,
            name: message.author.username,
          });
          await trpcNode.user.addCash.mutate({
            id: id,
            cash: Number(process.env.STARTING_CASH) + amount,
          });
        } else {
          await trpcNode.user.addCash.mutate({
            id: id,
            cash: amount,
          });
        }
      } catch (error) {
        console.log(error);
        return;
      }
    } else if (message.mentions.roles) {
      console.log("mentioned role!");
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
