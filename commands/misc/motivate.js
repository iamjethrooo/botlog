const fetch = require('node-fetch');
const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

module.exports = class MotivateCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'motivate',
      group: 'misc',
      memberName: 'motivate',
      description: 'Motivate your fellow BBCians!',
      throttling: {
        usages: 1,
        duration: 6
      }
    });
  }

  run(message) {
    fetch('http://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=en')
      .then(res => res.json())
      .then(json => {
        const embed = new MessageEmbed()
          .setTitle(json.quoteAuthor)
          .setDescription(json.quoteText)
          .setTimestamp()
        return message.reply(embed);
      })
      .catch(err => {
        message.say('An error occured, Chuck is investigating this!');
        return console.error(err);
      });
  }
};