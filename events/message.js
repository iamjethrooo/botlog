const picsOnlyChannels = ['669514957938753558', '800543054221541376', '669514986548232193', '671669574961201157', '801677818760003594'];
const index = require('../index.js');
const client = index.client;

module.exports = {
	run: message => {
		if (message.guild === null) return;
		const isBot = message.author.bot;
		// Removes text messages in media-only channels
		if (picsOnlyChannels.includes(message.channel.id) && !isBot) {
			const isAdmin = message.member.hasPermission('ADMINISTRATOR');
			if (!isAdmin) {
				// For discussions category
				if (!(message.attachments.size > 0 || message.embeds.length > 0)) {
					// Store values related to the message
					const discussionChannel = client.channels.cache.get('735804432985620521');
					const guildId = message.guild.id;
					const channelId = message.channel.id;
					const authorId = message.author.id;
					const content = message.content;
					let hasReplied = false;

					if (message.reference) hasReplied = true;
					let referenceId;
					if (hasReplied) referenceId = message.reference.messageID;
					//console.log(message);
					message.delete()
						.then(message.say(`Don't chat here, please use the <#735804432985620521> channel above.`)
							.then(message => message.delete({ timeout: 5000 }))
							.catch(console.error)
						)
						.catch(console.error);

					// If author replied to a message
					if (hasReplied) {
						discussionChannel.send(`**Message removed in:** <#${channelId}>\n**Message sent by:** <@${message.author.id}>\n**Message content:** ${message.content}\n**Message replied to:** https://discord.com/channels/${guildId}/${channelId}/${message.reference.messageID}`)
					}
					else {
						discussionChannel.send(`**Message removed in:** <#${channelId}>\n**Message sent by:** <@${message.author.id}>\n**Message content:** ${message.content}`)
					}
				}
			}
		}
	}
}
