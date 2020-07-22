const index = require('../index.js')
const client = index.client;

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
		client.snipes.set(message);
		if (message.guild.id === '732563481328484392') {
			channel = client.channels.cache.get('735378475279712359');
		}
		const embed = new MessageEmbed()
			.setAuthor(`${message.author.username}#${message.author.discriminator}`, message.author.displayAvatarURL({ dynamic: true} ))
			.setDescription(message.content)
			.setTimestamp(message.createdAt)

		return channel.say(embed);	}
}