import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
  Args
} from '@sapphire/framework';
import type { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  name: 'say',
  description: 'Say a message.'
})
export class SayCommand extends Command {

  public override async messageRun(message: Message, args: Args) {
    //const _message = await args.rest('string');
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
