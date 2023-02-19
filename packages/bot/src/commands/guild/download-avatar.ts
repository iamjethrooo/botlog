import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import type { CommandInteraction, Message } from "discord.js";
let download = require("download-file");

@ApplyOptions<CommandOptions>({
  name: "downloadavatar",
  description: "Pak u gwyn",
})
export class PingCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message) {
    if (!message.member!.permissions.has("ADMINISTRATOR")) {
      return;
    }

    await message.guild!.members.fetch();

    message.guild!.members.cache.forEach((user) => {
      let options = {
        directory: "./avatars",
        filename: `${user.user.username}.png`,
      };
      if (!user.user.bot) {
        download(user.displayAvatarURL(), options, function (err: any) {
          if (err) {
            options = {
              directory: "./avatars",
              filename: `${user.user.username}.png`,
            };
          }
            console.log(`Cannot download ${user.user.username}'s avatar!`);
        });
        console.log(`Downloaded ${user.user.username}'s avatar!`);
      }
    });

    return await message.reply("Downloaded!");
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
