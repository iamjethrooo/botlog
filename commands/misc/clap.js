const { Command } = require('discord.js-commando');

module.exports = class ClapCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'clap',
			group: 'misc',
			memberName: 'clap',
			description: 'Clap'
		});
	}

	run(message, args) {
		if (args.length < 1) {
			return message.say('Please provide a message to clapify.');
		}

		return message.say(args.split(' ').map(randomizeCase).join(':clap:'));
	}
}

const randomizeCase = word => word.split('').map(c => Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase()).join('');