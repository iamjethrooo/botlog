import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
  Args,
  container,
} from "@sapphire/framework";
import {
  CommandInteraction,
  MessageEmbed,
  Message,
  TextChannel,
} from "discord.js";
import { trpcNode } from "../../trpc";

// let download = require("download-file");

@ApplyOptions<CommandOptions>({
  name: "snipe",
  description: "Reveal the last deleted message in the channel.",
})
export class SnipeCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    return;
  }

  public override async messageRun(message: Message, args: Args) {
    if (!message.guild) {
      return await message.reply(`You can't use this command in a DM!`);
    }

    const { client } = container;
    const sniped = client.snipes.get(message.channel.id);
    let num = await args.pick("integer").catch(() => -1);
    try {
      let user = await trpcNode.user.getUserById.query({
        id: message.author.id,
      });
      let snipeCost = Number(process.env.SNIPE_COST);
      if (num > 0) {
        snipeCost = Number(process.env.SINGLE_SNIPE_COST);
      }
      if (!message.member!.permissions.has("ADMINISTRATOR")) {
        if (user!.user!.cash - snipeCost < 0) {
          const embed = new MessageEmbed()
            .setAuthor(
              `${message.author.username}#${message.author.discriminator}`,
              message.author.displayAvatarURL({ dynamic: true })
            )
            .setDescription(
              `❌ You do not have enough money to snipe. You currently have ${process.env.COIN_EMOJI}${String(
                user!.user!.cash
              )} on hand.`
            )
            .setColor("#ad3134");
          return await message
            .reply({ embeds: [embed] })
            .then((message) => setTimeout(() => message.delete(), 15000));
        }
        
        await trpcNode.user.subtractCash.mutate({
          id: message.author.id,
          cash: snipeCost,
        });
      }
    } catch (error) {
      console.log(error);
      return;
    }

    if (!sniped) {
      return await message
        .reply("There's nothing to snipe!")
        .then((message) => setTimeout(() => message.delete(), 15000))
        .then(message.delete);
    }

    if (num <= 0) {
      let content = `**${sniped[0].author}**: ${sniped[0].content}`;
      if (sniped.length > 1) {
        content = `**${sniped[1].author}**: ${sniped[1].content}\n` + content;
      }
      if (sniped.length > 2) {
        content = `**${sniped[2].author}**: ${sniped[2].content}\n` + content;
      }
      const embed = new MessageEmbed()
        .setDescription(content)
        .setColor(message.member!.displayHexColor!);
      return await message.reply({ embeds: [embed] });
    } else {
      num--;
      if (!sniped[num]) {
        return await message
          .reply("There's nothing to snipe!")
          .then((message) => setTimeout(() => message.delete(), 15000))
          .then(message.delete);
      }
      const singleSnipe = sniped[num];

      const embed = new MessageEmbed()
        .setAuthor(
          `${singleSnipe.author.username}#${singleSnipe.author.discriminator}`,
          singleSnipe.author.displayAvatarURL({ dynamic: true })
        )
        .setDescription(singleSnipe.content)
        .setTimestamp(singleSnipe.createdAt)
        .setColor(message.member!.displayHexColor);
      if (singleSnipe.channel instanceof TextChannel) {
        embed.setFooter("#".concat(singleSnipe.channel.name));
      }
      if (singleSnipe.attachments.size != 0) {
        // Download image
        // let url = singleSnipe.attachments.first()!.url;
        // embed.setImage(singleSnipe.attachments.first()!.url);
        // let options = {
        //   directory: "./images",
        // };

        // download(url, options, (err: any) => {
        //   if (err) throw err;
        // });
      }
      return await message.reply({ embeds: [embed] });
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
