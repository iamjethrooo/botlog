import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { container } from "@sapphire/framework";
import { PaginatedFieldMessageEmbed } from "@sapphire/discord.js-utilities";

@ApplyOptions<CommandOptions>({
  name: "queue",
  description: "Get a List of the Music Queue",
  preconditions: [
    "GuildOnly",
    "isCommandDisabled",
    "inVoiceChannel",
    "playerIsPlaying",
    "inPlayerVoiceChannel",
  ],
})
export class QueueCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const { client } = container;
    const queue = client.music.queues.get(interaction.guildId!);
    const baseEmbed = new EmbedBuilder().setColor("#FF0000").setAuthor({
      name: `${interaction.user.username}`,
      iconURL: interaction.user.displayAvatarURL(),
    });
    let index = 1;
    new PaginatedFieldMessageEmbed()
      .setTitleField("Queue")
      .setTemplate(baseEmbed)
      .setItems(await queue.tracks())
      .formatItems(
        (queueList: any) =>
          `${index++}) ***[${queueList.title}](${queueList.uri})***`
      )
      .setItemsPerPage(10)
      .make()
      .run(interaction);
  }

  public override registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): void {
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description,
    });
  }
}
