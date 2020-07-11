const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

module.exports = class HelpCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'help',
      group: 'misc',
      memberName: 'help',
      description: 'Displays commands.',
      throttling: {
        usages: 1,
        duration: 6
      }
    });
  }

  run(message) {
    const embed = new MessageEmbed()
    .setColor('#0099ff')
    .setAuthor('Command List', message.author.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: 'asd', value: 'asdsadsad'},
      { name: 'asdfasf', value: 'asdfasf'},
      { name: '🔧 Utility', value: '`ping` `help` `prefix` `invite`'},
      )

    return message.say(embed);
    }
};