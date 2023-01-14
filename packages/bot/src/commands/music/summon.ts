import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions
} from '@sapphire/framework';
import type { CommandInteraction } from 'discord.js';
import { container } from '@sapphire/framework';

@ApplyOptions<CommandOptions>({
  name: 'summon',
  description: 'Summon the bot to your VC!',
  preconditions: [
    'GuildOnly',
    'isCommandDisabled',
    'inVoiceChannel',
    'inPlayerVoiceChannel'
  ]
})
export class SummonCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction): Promise<any> {
    console.log('summoned!');
    const { client } = container;
    const { music } = client;

    // had a precondition make sure the user is infact in a voice channel
    const voiceChannel = interaction.guild?.voiceStates?.cache?.get(
      interaction.user.id
    )?.channel!;

    let queue = music.queues.get(interaction.guildId!);
    await queue.setTextChannelID(interaction.channel!.id);

    if (!queue.player) {
      const player = queue.createPlayer();
      await player.connect(voiceChannel.id, { deafened: true });
    }
    
  }

  public override registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): void {
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description
    });
  }
}
