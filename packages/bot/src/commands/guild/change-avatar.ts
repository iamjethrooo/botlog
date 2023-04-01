import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
  container
} from '@sapphire/framework';
import type { CommandInteraction, Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  name: 'change-avatar',
  description: 'Change the bot\'s avatar!',
  preconditions: ["inBotChannel", "userIsAdmin"]
})
export class ChangeAvatarCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
  }

  public override async messageRun(message: Message) {
    const { client } = container;
    let messageAttachment = message.attachments.size > 0 ? message.attachments.first()!.url : null
    if (messageAttachment) {
        client.user!.setAvatar(messageAttachment);
        message.channel.send("Changed display picture!");
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
