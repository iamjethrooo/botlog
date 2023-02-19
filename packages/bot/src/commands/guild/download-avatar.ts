import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import type { CommandInteraction, Message } from "discord.js";
const fs = require("fs");
const download = require("download");

@ApplyOptions<CommandOptions>({
  name: "downloadavatar",
  description: "Pak u gwyn",
  enabled: false,
})
export class PingCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message) {
    if (!message.member!.permissions.has("ADMINISTRATOR")) {
      return;
    }

    await message.guild!.members.fetch();

    let regex = /[\\\/:*?"<>|]/g;
    // let illegalCharacters = `\\/:*?"<>|`;
    message.guild!.members.cache.forEach(async (user) => {
      let filename = `${user.user.username}.gif`;
      if (!user.user.bot) {
        // filename = filename.replace(regex, "");
        // filename = "./avatars/" + filename;
        console.log(filename);
        fs.writeFileSync(
          "./avatars/" + filename.replaceAll(regex, ""),
          await download(user.displayAvatarURL())
        );
        console.log(`Downloaded ${user.user.username}'s avatar!`);
      }
    });
    console.log(
      "Ashii | Kerbal's デリヘル.gif".replaceAll(`/[\\\/:*?"<>|]/`, "")
    );
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
