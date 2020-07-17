const fetch = require('node-fetch');
const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

module.exports = class ChuckNorrisCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'spam',
			aliases: ['morgan'],
			group: 'misc',
			memberName: 'spam',
			description: 'Get a ...!',
			throttling: {
				usages: 1,
				duration: 6,
			},
		});
	}

	run(message) {
		fetch('https://www.reddit.com/r/copypasta/new.json?sort=top', {
			method: 'GET',
		})
			.then(res => res.json())
			.then(json => {
				const rand = Math.floor(Math.random() * json.data.dist);
				console.log(`RAND: ${rand}`);
				return message.say(json.data.children[rand].data.selftext, { split: true });
			})
			.catch(err => {
				message.say('An error occured!');
				return console.error(err);
			});
	}
};