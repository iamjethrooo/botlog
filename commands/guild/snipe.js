const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

module.exports = class SnipeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'snipe',
			group: 'guild',
			memberName: 'snipe',
			description: 'Reveal the last deleted message in the channel.'
		});
	}

	run(message) {
		if (!message.guild) {
			return message.say(`You can't use this command in a DM!`);
		}

		const sniped = this.client.snipes.get(message.channel.id);


		if (message.member.hasPermission('ADMINISTRATOR') || message.member.roles.cache.find(r => r.name === "Sniper" || r.name === "Enforcer" || r.name === "Ruby (Lvl. 75+)" || r.name === "Emerald (Lvl. 60+)" || r.name === "Sapphire (Lvl. 45+)" || r.name === "Steel (Lvl. 30+)" || r.name === "Obsidian (Lvl. 15+)")) {
			if (!sniped) {
				return message.say('There\'s nothing to snipe!').then(message => message.delete({ timeout: 15000 }));
			}
			let content = `**${sniped[0].author}**: ${sniped[0].content}`;
			if (sniped.length > 1) {
				content = `**${sniped[1].author}**: ${sniped[1].content}\n` + content;
			}
			if (sniped.length > 2) {
				content = `**${sniped[2].author}**: ${sniped[2].content}\n` + content;
			}
			const embed = new MessageEmbed()
				.setDescription(content)
				.setColor(message.member.displayHexColor)
			return message.say(embed);
		}
	}
}
