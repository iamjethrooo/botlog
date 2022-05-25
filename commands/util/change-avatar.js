const { Command } = require('discord.js-commando');
const index = require('../../index.js')

module.exports = class ChangeDPCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'change-avatar',
			aliases: ['change-dp', 'avatar-set'],
			group: 'util',
			memberName: 'change-avatar',
			description: 'Changes the bots profile picture.',
			format: '<image>'
		});
	}

	run(message) {
		const isAdminOrOwner = message.member.hasPermission('ADMINISTRATOR') || message.guild.ownerID == message.author.id || message.member.id === "496523098439548929";
		if (isAdminOrOwner) {
			console.log("Hello!");
			if (message.attachments.size > 0 || message.embeds.length > 0) {
				const image = message.attachments.first().url;
				index.client.user.setAvatar(image)
					.then(user => message.say('New avatar set!'))
					.catch(console.error);
			} else {
				message.say('You need to include an image.');
			}
		}
	}
}
