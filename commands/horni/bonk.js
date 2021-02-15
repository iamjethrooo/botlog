const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

module.exports = class GinBonkCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'ginbonk',
			group: 'horni',
			memberName: 'ginbonk',
			description: 'Bonk.'
		});
	}

	run(message) {
		if (!message.guild) {
			return message.say(`You can't use this command in a DM!`);
		}

		return message.say("<a:Ginbonk:808888585511501895>");
	}
}