const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

module.exports = class EditSnipeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'editsnipe',
			group: 'guild',
			memberName: 'editsnipe',
			description: 'Reveal the last edited message in the channel.'
		});
	}

	async run(message) {
		if (!message.guild) {
			return message.say(`You can't use this command in a DM!`);
		}

		const editsniped = this.client.editsnipes.get(message.channel.id);

		if (message.member.hasPermission('ADMINISTRATOR') || message.member.roles.cache.find(r => r.name === "Sniper" || r.name === "Enforcer" || r.name === "Ruby (Lvl. 75+)" || r.name === "Emerald (Lvl. 60+)" || r.name === "Sapphire (Lvl. 45+)" || r.name === "Steel (Lvl. 30+)" || r.name === "Obsidian (Lvl. 15+)")) {
			if (!editsniped) {
				return message.say('There\'s nothing to snipe!').then(message => message.delete({ timeout: 15000 }));
			}
			message.channel.messages.fetch(editsniped.id).then(m => {
			 	const embed = new MessageEmbed()
			 		.setAuthor(`${editsniped.author.username}#${editsniped.author.discriminator}`, editsniped.author.displayAvatarURL({ dynamic: true }))
			 		.setDescription(`**Original message:** ${editsniped.content}\n**Edited message:** ${m.content}`)
			 		.setTimestamp(editsniped.createdAt)
			 		.setColor(message.member.displayHexColor)
			 	return message.say(embed);
		 });
		}
	}
}
