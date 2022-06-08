import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions
} from '@sapphire/framework';
import type { CommandInteraction, Message } from 'discord.js';
const { Util: { splitMessage } } = require('discord.js');
import fetch from 'node-fetch';

@ApplyOptions<CommandOptions>({
  name: 'spam',
  description: 'spamspamspamspamspamspamspam'
})
export class SpamCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    fetch('https://www.reddit.com/r/copypasta/new.json?sort=top', {
        method: 'GET',
    })
        .then(res => res.json())
        .then(json => {
            const rand = Math.floor(Math.random() * json.data.dist);
            const split = splitMessage(json.data.children[rand].data.selftext)
            for (let s of split) {
                interaction.channel!.send(s);
            }
            return;
        })
        .catch(err => {
            interaction.reply('An error occured!');
            return console.error(err);
        });
  }

  public override async messageRun(message: Message) {
    if (message.channel.id == '682838969179832423') {
        
    }
    fetch('https://www.reddit.com/r/copypasta/new.json?sort=top', {
        method: 'GET',
    })
        .then(res => res.json())
        .then(json => {
            const rand = Math.floor(Math.random() * json.data.dist);
            const split = splitMessage(json.data.children[rand].data.selftext)
            for (let s of split) {
                message.channel.send(s);
            }
            return;
        })
        .catch(err => {
            message.reply('An error occured!');
            return console.error(err);
        });
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
