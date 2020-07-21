const { MessageEmbed } = require('discord.js')

const search = async(message, args, client) => {
	const users = await client.users.cache.filter(u => u.username.toLowerCase() == args.toLowerCase());
	const filter = response => response.author.id === message.author.id || choices.includes(parseInt(response));
	if (users.size > 1) {
		let i = 1;
		let choices = [];
		const embed = new MessageEmbed()
			.setAuthor('Multiple results found. Please pick one.')
			.setDescription('')
			.setTimestamp();
		users.forEach(user => {
			embed.setDescription(`${embed.description}\n\`${i}. ${user.username}#${user.discriminator}\``)
			choices[i] = user.id;
			i++;
		});
		let id;
		await message.say(embed).then(async () => {
			await message.channel.awaitMessages(filter, { max: 1, time: 5000 })
				.then(collected => {
					let number = parseInt(collected.first().content);
					id = choices[number];
				})
				.catch(collected => {
					console.error;
					return 'Error';
				});
		});
		return id;
	} else {
		if (users.size < 1) {
			message.say('User does not exist!');
			return null;
		} else {
			return users.first().id;
		}
	}
}

module.exports = search;