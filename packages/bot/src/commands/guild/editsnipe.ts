import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
  container,
} from "@sapphire/framework";
import {
  CommandInteraction,
  EmbedBuilder,
  Message,
  GuildMember,
} from "discord.js";

@ApplyOptions<CommandOptions>({
  name: "editsnipe",
  description: "Reveal the last edited message in the channel.",
})
export class EditSnipeCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    if (!interaction.guild)
      return interaction.reply(`You can't use this command in a DM!`);
    const { client } = container;

    if (
      (<GuildMember>interaction.member)!.permissions.has("Administrator") ||
      (<GuildMember>interaction.member)!.roles.cache.find(
        (r) =>
          r.name === "Sniper" ||
          r.name === "Enforcer" ||
          r.name === "Ruby (Lvl. 75+)" ||
          r.name === "Emerald (Lvl. 60+)" ||
          r.name === "Sapphire (Lvl. 45+)" ||
          r.name === "Steel (Lvl. 30+)" ||
          r.name === "Obsidian (Lvl. 15+)"
      )
    ) {
      const editsniped = client.editsnipes.get(interaction.channelId);
      if (editsniped === undefined) {
        return await interaction.reply({
          ephemeral: true,
          content: "There's nothing to snipe!",
        });
      }

      interaction
        .channel!.messages.fetch(editsniped.id)
        .then((m) => {
          const embed = new EmbedBuilder()
            .setAuthor({
              name: `${editsniped.author.username}`,
              iconURL: editsniped.author.displayAvatarURL(),
            })
            .setDescription(
              `**Original message:** ${editsniped.content}\n**Edited message:** ${m.content}`
            )
            .setTimestamp(editsniped.createdAt)
            .setColor((<GuildMember>interaction.member)!.displayHexColor);
          return interaction.reply({ embeds: [embed] });
        })
        .catch(async (err) => {
          return await interaction.reply({
            ephemeral: true,
            content: "There's nothing to snipe!",
          });
        });
    } else {
      await interaction.reply(
        "You don't have the permissions to run this command!"
      );
      setTimeout(() => interaction.deleteReply(), 15000);
      return;
    }
    return;
  }

  public override async messageRun(message: Message) {
    if (!message.guild)
      return message.reply(`You can't use this command in a DM!`);
    const { client } = container;

    if (
      message.member!.permissions.has("Administrator") ||
      message.member!.roles.cache.find(
        (r) =>
          r.name === "Sniper" ||
          r.name === "Enforcer" ||
          r.name === "Ruby (Lvl. 75+)" ||
          r.name === "Emerald (Lvl. 60+)" ||
          r.name === "Sapphire (Lvl. 45+)" ||
          r.name === "Steel (Lvl. 30+)" ||
          r.name === "Obsidian (Lvl. 15+)"
      )
    ) {
      const editsniped = client.editsnipes.get(message.channelId);
      if (!editsniped) {
        return await message
          .reply("There's nothing to snipe!")
          .then((message) => setTimeout(() => message.delete(), 15000))
          .then(message.delete);
      }

      message.channel.messages
        .fetch(editsniped.id)
        .then((m) => {
          const embed = new EmbedBuilder()
            .setAuthor({
              name: `${editsniped.author.username}`,
              iconURL: editsniped.author.displayAvatarURL(),
            })
            .setDescription(
              `**Original message:** ${editsniped.content}\n**Edited message:** ${m.content}`
            )
            .setTimestamp(editsniped.createdAt)
            .setColor(message.member!.displayHexColor);
          return message.reply({ embeds: [embed] });
        })
        .catch(async (err) => {
          return await message
            .reply("There's nothing to snipe!")
            .then((message) => setTimeout(() => message.delete(), 15000))
            .then(message.delete);
        });
      return;
    } else {
      return await message
        .reply("You don't have the permissions to run this command!")
        .then((message) => setTimeout(() => message.delete(), 15000));
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
