const { CommandoClient } = require('discord.js-commando');
const path = require('path');

const {
	prefix,
	token,
} = require('./config.json');

const client = new CommandoClient ({
	commandPrefix: prefix,
	owner: '496523098439548929',
	invite: '',
	unknownCommandResponse: false,
});

client.registry
	.registerDefaultTypes()
	.registerGroups([
		['animals', 'Animal Commands'],
		['guild', 'Guild Commands'],
		['music', 'Music Commands'],
		['misc', 'Miscellaneous Commands'],
	])
	.registerDefaultGroups()
	.registerDefaultCommands({
		help: false,
	})
	.registerCommandsIn(path.join(__dirname, 'commands'));


client.once('ready', () => {
	console.log(`Logged in as ${client.user.tag}! (${client.user.id})`);
	client.user.setActivity('your mother', {
		type: 'STREAMING',
		url: 'https://www.twitch.tv/greekgodx',
	});
});

client.on('message', message => {
	// If message is media
	if (message.channel.id == '733239970562703411') {
		if(!(message.attachments.size > 0 || message.embeds.length > 0)) {
			message.delete();
		}
	}
});

client.on('error', console.error);

client.login(token);