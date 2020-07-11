const { Command } = require('discord.js-commando');
const rp = require('request-promise');
const moment = require('moment');
const cheerio = require('cheerio');
const { MessageEmbed } = require('discord.js');

module.exports = class FloridaManCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'floridaman',
      aliases: ['florida', 'onthisday', 'otd'],
      group: 'misc',
      memberName: 'floridaman',
      description: 'Generate a Florida Man headline!',
      throttling: {
        usages: 1,
        duration: 6
      }
    });
  }

  run(message) {
  	console.log(message);
  	let url = 'https://floridamanbirthdaychallenge.com/floridaman/';
  	let args = message.argString.slice(1).split(/ +/).join(' ')
  	args = args.toLowerCase();
  	if (args.length > 0){
  		console.log(args);
  		if (checkDate(args, 'MMMM DD') || checkDate(args, 'MMM DD')) {
  			args = moment(args).format('MMMM-DD');
  			url += args.toLowerCase();
  		}
  		else if (args == 'now' || args == 'today') {
  			args = moment().format('MMMM-DD');
  			url += args.toLowerCase();
  		}
  		else {
  			return message.say("Invalid date!");
  		}
  	}

  	rp(url)
  		.then(function(html){
  			let $ = cheerio.load(html);
  			let title = $('title', html).text().slice(args.length + 1);
  			title = title.substr(0, title.length - 13);
  			console.log(title);
  			let date = moment(args).format('MMMM DD');
  			let imageUrl = $('img.attachment-twentyseventeen-featured-image').attr('src');
  			imageUrl.split(/ +/);
  			const embed = new MessageEmbed()
  				.setColor('#D2691E')
  				.setTitle(`${date} Florida News`)
  				.setDescription(title)
  				.setURL(imageUrl)
  				.setThumbnail(imageUrl)
  				.setFooter(`Requested by ${message.author.username}#${message.author.discriminator}`)
  			return message.say(embed);
  		})
  		.catch(console.error);
  }
};

function checkDate(date, dateFormat) {
	return moment(date, dateFormat, true).isValid();
}