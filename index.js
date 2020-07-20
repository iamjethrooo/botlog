const { CommandoClient } = require('discord.js-commando');
const path = require('path');

require('dotenv').config();

const client = new CommandoClient ({
	commandPrefix: process.env.PREFIX,
	owner: '496523098439548929',
	invite: '',
	unknownCommandResponse: false,
});

client.registry
	.registerDefaultTypes()
	.registerGroups([
		['animals', 'Animal Commands'],
		['fun', 'Fun Commands'],
		['guild', 'Guild Commands'],
		['music', 'Music Commands'],
		['util', 'Utility Commands'],
	])
	.registerDefaultGroups()
	.registerDefaultCommands({
		help: false,
		unknownCommand: false,
		ping: false,
		prefix: false
	})
	.registerCommandsIn(path.join(__dirname, 'commands'));


client.once('ready', () => {
	console.log(`Logged in as ${client.user.tag}! (${client.user.id})`);
	client.user.setPresence({
		status: 'online',
		activity: {
			name: 'Netflix with Express VPN',
			type: 'WATCHING',
			url: 'https://www.twitch.tv/mrmoo_linux'
		},
		clientStatus: 'Test'
	})
	.catch(console.error);
});

const picsOnlyChannels = ['733239970562703411', '669514986548232193', '669520318615912466'];
client.on('message', message => {
	const isBot = message.author.bot;
	// Removes text messages in media-only channels
	if (picsOnlyChannels.includes(message.channel.id) && !isBot) {
		
		const isAdmin = message.member.hasPermission('ADMINISTRATOR');
		if (!isAdmin) {
			if (!(message.attachments.size > 0 || message.embeds.length > 0)) {
				message.delete()
					.then(message.say(`Don't chat here.`)
						.then(message => message.delete({ timeout: 5000 }))
						.catch(console.error)
						);
			}
		}
	}

	// Auto reacts to images posted in #memes in BBC Discord
	if (message.guild.id == '669190303353143306') {
		if (message.channel.id == '669355693140213780') {
			if (message.attachments.size > 0 || message.embeds.length > 0) {
				message.react(message.guild.emojis.cache.find(emoji => emoji.name == 'DrakeYes'));
				message.react(message.guild.emojis.cache.find(emoji => emoji.name == 'DrakeNo'));
			}
		}
	}
});

client.on('error', console.error);

client.login(process.env.DISCORD_TOKEN);

module.exports.client = client;