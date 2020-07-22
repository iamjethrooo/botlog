const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

module.exports = class SnipeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'snipe',
			group: 'guild',
			memberName: 'snipe',
			description: 'Reveal the last deleted message in the channel!'
		});
	}

	run(message) {
		const sniped = this.client.snipes.get(message.channel.id);
		if (!sniped) {
			return message.say('There\'s nothing to snipe!');
		}
		const embed = new MessageEmbed()
			.setAuthor(`${sniped.author.username}#${sniped.author.discriminator}`, sniped.author.displayAvatarURL({ dynamic: true} ))
			.setDescription(sniped.content)
			.setTimestamp(sniped.createdAt)
		return message.say(embed);
	}
}