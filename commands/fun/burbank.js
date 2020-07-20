const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

module.exports = class BurbankCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'burbank',
			group: 'fun',
			memberName: 'burbank',
			description: 'Look at The Burbank\'s Ungodly Concoction'
		});
	}

	run(message) {
		const embed = new MessageEmbed()
			.setColor('#893cbc')
			.setTitle('The Burbank')
			.setThumbnail('https://cdn.discordapp.com/attachments/734048924519759982/734070202118963290/JPEG_20200718_233247.jpg')
			.setDescription('1 shot Gin\n1 teaspoon Hot Sauce\n1 teaspoon Whole Pepper Corn\n1 teaspoon Bear Brand\n1 teaspoon Curry Powder')
			.setURL('https://discordapp.com/channels/669190303353143306/734048924519759982/734070202500776036')
			.setFooter('Burbank\'s Ungodly Concoction');
		message.say(embed);
	}
}