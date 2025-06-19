import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Args,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import {
  Message,
  EmbedBuilder,
  GuildMember,
  ChatInputCommandInteraction,
  TextChannel,
} from "discord.js";
import { trpcNode } from "../../trpc";

async function bail(prisoner: GuildMember) {
  const heistBailRate = await trpcNode.setting.getByKey.mutate({
    key: "heistBailRate",
  });
  const coinEmoji = await trpcNode.setting.getByKey.mutate({
    key: "coinEmoji",
  });
  const greenColor = await trpcNode.setting.getByKey.mutate({
    key: "greenColor",
  });
  const redColor = await trpcNode.setting.getByKey.mutate({
    key: "redColor",
  });

  let userId = prisoner.id;
  let user = await trpcNode.user.getUserById.query({
    id: userId,
  });

  const embed = new EmbedBuilder().setAuthor({
    name: `${prisoner.user.username}#${prisoner.user.discriminator}`,
    iconURL: prisoner.user.displayAvatarURL(),
  });

  let bailAmount = Math.round(user.user?.cash! * Number(heistBailRate));
  let insufficientFunds = user!.user!.cash < bailAmount;
  if (insufficientFunds) {
    embed.setDescription(`❌ You do not have enough money to make bail!`);
    embed.setColor(`#${redColor}`);
    return embed;
  }
  const roleIdInmate = await trpcNode.setting.getByKey.mutate({
    key: "roleIdInmate",
  });
  let inmateRole = prisoner.guild.roles.cache.find(
    (role) => role.id == roleIdInmate!
  );
  prisoner.roles.remove(inmateRole!);

  await trpcNode.user.subtractCash.mutate({
    id: userId,
    cash: bailAmount,
  });

  await trpcNode.guild.addToBank.mutate({
    id: prisoner.guild.id,
    amount: bailAmount,
  });
  embed.setDescription(
    `✅ You paid ${coinEmoji}${bailAmount} as bail and have been released from jail.`
  );
  embed.setColor(`#${greenColor}`);

  return embed;
}

@ApplyOptions<CommandOptions>({
  name: "bail",
  description: "Pay bail to get out of jail.",
  preconditions: ["inBotChannel", "isInmate"],
})
export class BailCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const embed = await bail((<GuildMember>interaction.member)!);
    return await interaction.reply({ embeds: [embed] });
  }

  public override async messageRun(message: Message, args: Args) {
    const embed = await bail(message.member!);
    return await (message.channel as TextChannel).send({ embeds: [embed] });
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
