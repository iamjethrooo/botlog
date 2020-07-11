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
		['misc', 'Miscellaneous Commands'],
		['guild', 'Guild Commands'],
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

client.on('error', console.error);

client.login(token);