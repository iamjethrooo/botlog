import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
  Args,
  container,
} from "@sapphire/framework";
import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import { trpcNode } from "../../trpc";

@ApplyOptions<CommandOptions>({
  name: "take",
  description: "Take coins from a user.",
  preconditions: ["inBotChannel", "userIsAdmin"],
})
export class TakeCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message, args: Args) {
    let amount = await args.pick("integer").catch(() => 0);

    // Take cash from a user
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
            cash: Number(process.env.STARTING_CASH) - amount,
          });
        } else {
          await trpcNode.user.subtractCash.mutate({
            id: id,
            cash: amount,
          });
        }

        const embed = new MessageEmbed()
          .setAuthor(
            `${message.author.username}#${message.author.discriminator}`,
            message.author.displayAvatarURL({ dynamic: true })
          )
          .setDescription(
            `Took ${process.env.COIN_EMOJI}${String(amount)} from <@${id}>.`
          )
          .setTimestamp(message.createdAt)
          .setColor(message.member!.displayHexColor);
        return await message.reply({ embeds: [embed] });
      } catch (error) {
        console.log(error);
        return;
      }
    }
    // Take cash from a role
    else if (message.mentions.roles) {
      let id = message.mentions.roles.first()!.id;

      const { client } = container;
      const guild = client.guilds.cache.get(message.guildId!);
      try {
        guild!.members.fetch().then((members) =>
          members.forEach(async (member) => {
            if (member.roles.cache.some((role) => role.id == id)) {
              // Check if user exists in database
              let user = await trpcNode.user.getUserById.query({
                id: member.user.id,
              });

              if (user.user == null) {
                await trpcNode.user.create.mutate({
                  id: member.user.id,
                  name: message.author.username,
                });
                await trpcNode.user.addCash.mutate({
                  id: member.user.id,
                  cash: Number(process.env.STARTING_CASH) - amount,
                });
              } else {
                await trpcNode.user.subtractCash.mutate({
                  id: member.user.id,
                  cash: amount,
                });
              }
            }
          })
        );

        const embed = new MessageEmbed()
          .setAuthor(
            `${message.author.username}#${message.author.discriminator}`,
            message.author.displayAvatarURL({ dynamic: true })
          )
          .setDescription(
            `Took ${process.env.COIN_EMOJI}${String(amount)} from <@&${id}>.`
          )
          .setTimestamp(message.createdAt)
          .setColor(message.member!.displayHexColor);
        return await message.reply({ embeds: [embed] });
      } catch (error) {
        console.log(error);
        return;
      }
    }

    return;
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
