/*
import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
  container,
} from "@sapphire/framework";

import {
  CommandInteraction,
  Message,
  ApplicationCommandOptionType,
} from "discord.js";

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

@ApplyOptions<CommandOptions>({
  name: "prompt",
  aliases: ["gpt", "ai-chat"],
  description: "Get creative responses, powered by AI.",
})
export class PromptCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message) {
    const { client } = container;
    try {
      const response = await client.openai.createCompletion({
        prompt: message.content,
        model: "text-davinci-002",
        max_tokens: 60,
        temperature: 0.3,
        top_p: 0.3,
        presence_penalty: 0,
        frequency_penalty: 0.5,
      });
      const generatedText = response.data.choices[0].text!;
      message.channel.send(generatedText);
      const split = splitMessage(generatedText);
      for (let s of split) {
        message.channel.send(s);
      }
      return;
    } catch (err) {
      console.error(err);
      return message.reply(
        "Sorry, something went wrong. I am unable to process your query."
      );
    }
  }

  public override registerApplicationCommands(
    registery: ApplicationCommandRegistry
  ): void {
    registery.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          type: ApplicationCommandOptionType.String,
          required: true,
          name: "prompt",
          description: "What do you want to ask/say?",
        },
      ],
    });
  }
}
*/
