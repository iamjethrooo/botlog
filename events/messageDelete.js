const index = require('../index.js');
const client = index.client;
const { MessageEmbed } = require('discord.js');

client.snipes = {
	get: function(ChannelId) {
		return this[ChannelId];
	},
	add: function(msg) {
		let snipes = [];
		if (this[msg.channel.id] === undefined) {
			snipes.push(msg);
		} else {
			snipes = this[msg.channel.id];
			snipes.unshift(msg);
		}
		snipes.length = Math.min(snipes.length, 3);
		console.log(snipes.length);
		this[msg.channel.id] = snipes;
	}
}

module.exports = {
	run: message => {
		if (message.author.bot) return;
		client.snipes.add(message);
	}
}
