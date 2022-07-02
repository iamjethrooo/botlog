// ts-nocheck
import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
  container
} from '@sapphire/framework';
import type { CommandInteraction, GuildMember } from 'discord.js';
import { DiscordTogether } from 'discord-together';

@ApplyOptions<CommandOptions>({
  name: 'party',
  description: 'Watch YouTube videos together!'
})
export class PartyCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    if (!interaction.guild) {
      return await interaction.reply(`You can't use this command in a DM!`);
    }
    const { client } = container;
    let discordTogether = new DiscordTogether(client);
    if ((<GuildMember>interaction.member).voice.channel) {
      discordTogether.createTogetherCode((<GuildMember>interaction.member).voice.channel!.id, 'youtube').then(async invite => {
        return await interaction.reply(invite.code);
      })
    }
  }

  public override registerApplicationCommands(
    registery: ApplicationCommandRegistry
  ): void {
    registery.registerChatInputCommand({
      name: this.name,
      description: this.description
    });
  }
}
