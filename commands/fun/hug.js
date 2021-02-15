const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

module.exports = class RiceCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'hug',
			group: 'fun',
			memberName: 'hug',
			description: 'Hugs.'
		});
	}

	run(message) {
		if (!message.guild) {
			return message.say(`You can't use this command in a DM!`);
		}

		return message.say("<:knowthatfeel:696684829986521159>");
	}
}