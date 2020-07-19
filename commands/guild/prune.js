const { Command } = require('discord.js-commando');

module.exports = class PruneCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'prune',
			aliases: ['delete-messages', 'bulk-delete'],
			description: 'Delete up to 99 recent messages',
			format: '<number>',
			group: 'guild',
			memberName: 'prune',
			guildOnly: true,
			userPermissions: ['MANAGE_CHANNELS', 'MANAGE_MESSAGES'],
			args: [
				{
					key: 'deleteCount',
					prompt: 'How many messages do you want to delete?',
					type: 'integer',
					validate: deleteCount => deleteCount < 100 && deleteCount > 0,
				},
			],
		});
	}

	run(message, { deleteCount }) {
		if(msg.guild) {
			if(!msg.member.hasPermission('ADMINISTRATOR') && !this.client.isOwner(msg.author)) {
				return msg.reply('Only administrators may use this command.');
			}
		}		
		message.channel
			.bulkDelete(deleteCount + 1)
			.then(messages => {
				message.say(`Deleted ${deleteCount} messages`)
					.then(message => message.delete({ timeout: 5000 }))
					.catch(console.error);
			})
			.catch(e => {
				console.error(e);
				return message.say(
					'Something went wrong when trying to delete messages :(',
				);
			});
	}
};