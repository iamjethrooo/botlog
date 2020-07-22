const index = require('../index.js')
const client = index.client;
const { MessageEmbed } = require('discord.js');

client.snipes = {
	get: function(ChannelId) {
		return this[ChannelId];
	},
	set: function(msg) {
		this[msg.channel.id] = msg;
	}
}

module.exports = {
	run: message => {
		let channel;
		if (message.author.bot) return;
		client.snipes.set(message);
		if (message.guild.id === '732563481328484392') {
			channel = client.channels.cache.get('735378475279712359');
		} else if (message.guild.id === '669190303353143306') {
			channel = cliend.channels.cache.get('735391451831205909');
		}
		const embed = new MessageEmbed()
			.setAuthor(`${message.author.username}#${message.author.discriminator}`, message.author.displayAvatarURL({ dynamic: true} ))
			.setDescription(message.content)
			.setTimestamp(message.createdAt)
		return channel.send(embed);	
	}
}