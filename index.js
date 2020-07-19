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
	const isAdmin = message.member.hasPermission('ADMINISTRATOR');

	// Removes text in media-only channel
	if (picsOnlyChannels.includes(message.channel.id)) {
		if (!isAdmin && !isBot) {
			if (!(message.attachments.size > 0 || message.embeds.length > 0)) {
				message.delete();
				message.say(`Don't chat here.`)
					.then(message => message.delete({ timeout: 5000 }))
					.catch(console.error);
			}
		}
	}
});

client.on('guildCreate', guild => {
	const channel = client.channels.cache.get('669193383503200266');
	// channel.send('Pa shoutout po kay <@>');
	channel.send('Salamat po sa pag invite 🙂');
	channel.send('Pa shoutout po kay Chief Investigator <@699632157236396082>'); // Gabby
	channel.send('Pa shoutout po kay <@454079835958935562>, alias Icarus, alias blaze, alias Oni, alias 𝐹𝓇𝑒𝓎𝒶'); // Blaze
	channel.send('Pa shoutout po kay <@602678848693338134>, musta sa NYC?'); // Gin
	channel.send('Pa shoutout po kay <@509434286022328340>, hi daw sabi ng asawa nya'); // Morgan
	channel.send('Pa shoutout po sa Linus ng Baguio, <@321156839020691457> na mahaba rin ang hair'); // Mr. M00
	channel.send('Pa shoutout po sa server owner nating malupet, <@543589081574015036>'); // Rice
	channel.send('Pa shoutout po sa mga admin ng server, <@625722729991241756> <@429778312869707776> <@486944028663873536> nice job po mga ser');
	channel.send('Pa shoutout po kay <@458231661239205888>, tara Raft'); // LLLL
	channel.send('Pa shoutout po kay <@302076261281300491> who tried to lick a toad once');
	channel.send('CACAWW! Shoutout po kay <@264666701633683456>, balang araw magiging mod ka rin'); // Crow
	channel.send('Pa shoutout po kay <@386805742730084353>, sOmeBoDY COme Giiit Heeer, ShE\'S DanCIng LiKE A sStrRIPERR'); // Kaito
	channel.send('Pa shoutout po kay <@496523098439548929> ang pogi nyo po, sana all'); // Jethro
	channel.send('Sa mga hindi ko po nashoutout, i-like at share nyo lang po yung facebook page natin, ishoutout ko kayo sa next na livestream. 😘');
});

client.on('error', console.error);

client.login(process.env.DISCORD_TOKEN);