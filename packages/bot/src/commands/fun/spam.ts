import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import type { CommandInteraction, Message } from "discord.js";

import fetch from "node-fetch";

@ApplyOptions<CommandOptions>({
  name: "spam",
  description: "spamspamspamspamspamspamspam",
})
export class SpamCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    if (
      interaction.guildId == "669190303353143306" &&
      interaction.channelId != "682838969179832423"
    ) {
      return await interaction.reply({
        ephemeral: true,
        content: "You can't use that command here!",
      });
    }
    fetch("https://www.reddit.com/r/copypasta/new.json?sort=top", {
      method: "GET",
    })
      .then((res) => res.json())
      .then((json) => {
        const rand = Math.floor(Math.random() * json.data.dist);
        const split = splitMessage(json.data.children[rand].data.selftext);
        for (let s of split) {
          interaction.channel!.send(s);
        }
        return;
      })
      .catch((err) => {
        interaction.reply("An error occured!");
        return console.error(err);
      });
    return;
  }

  public override async messageRun(message: Message) {
    if (
      message.guildId == "669190303353143306" &&
      message.channel.id != "682838969179832423"
    ) {
      return;
    }
    fetch("https://www.reddit.com/r/copypasta/new.json?sort=top", {
      method: "GET",
    })
      .then((res) => res.json())
      .then((json) => {
        const rand = Math.floor(Math.random() * json.data.dist);
        const split = splitMessage(json.data.children[rand].data.selftext);
        for (let s of split) {
          message.channel.send(s);
        }
        return;
      })
      .catch((err) => {
        message.reply("An error occured!");
        return console.error(err);
      });
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

function splitMessage(str: String) {
  const MAX_LENGTH = 2000;
  const words = str.split(" ");
  const result: string[] = [];
  let currentLine = "";

  // Iterate through each word in the input string
  for (let i = 0; i < words.length; i++) {
    const word = words[i]; // Current word being processed

    if (currentLine.length + word.length + 1 <= MAX_LENGTH) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      result.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    result.push(currentLine);
  }

  return result;
}
