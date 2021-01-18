const picsOnlyChannels = ['733239970562703411', '669514986548232193', '669520318615912466', '735401124135174185', '669514957938753558', '671669574961201157', '732928099938992128', '800543054221541376'];
module.exports = {
	run: message => {
		if (message.guild === null) return;
		const isBot = message.author.bot;
		// Removes text messages in media-only channels
		if (picsOnlyChannels.includes(message.channel.id) && !isBot) {
			
			const isAdmin = message.member.hasPermission('ADMINISTRATOR');
			if (!isAdmin) {
				if (!(message.attachments.size > 0 || message.embeds.length > 0)) {
					console.log(message);
					message.delete()
						.then(message.say(`Don't chat here, please use the <#735804432985620521> channel above.`)
							.then(message => message.delete({ timeout: 5000 }))
							.catch(console.error)
							)
						.catch(console.error);
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
	}
}