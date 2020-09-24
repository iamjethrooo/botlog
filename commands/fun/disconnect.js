const { Command } = require('discord.js-commando');

module.exports = class DisconnectCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'disconnect',
			aliases: ['dc'],
			group: 'fun',
			memberName: 'disconnect',
			description: 'Summon the bot to your VC!'
		});
	}

	run(message) {
		console.log(message);
		message.member.voice.channel.leave();
	}
}