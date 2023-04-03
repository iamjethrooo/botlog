import { ApplyOptions } from '@sapphire/decorators';
import {
  ChatInputCommandDeniedPayload,
  Listener,
  ListenerOptions,
  UserError
} from '@sapphire/framework';

@ApplyOptions<ListenerOptions>({
  name: 'chatInputCommandDenied'
})
export class CommandDeniedListener extends Listener {
  public override async run(
    { message: content }: UserError,
    { interaction }: ChatInputCommandDeniedPayload
  ) {
    return await interaction.reply({
      ephemeral: true,
      content: content
    });
  }
}
