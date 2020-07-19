const { Command } = require('discord.js-commando');
require('dotenv').config();
const querystring = require('query-string');
const r2 = require('r2');

module.exports = class DogCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'dog',
			aliases: ['aso', 'dogs'],
			group: 'animals',
			memberName: 'dog',
			description: 'Woof.',
		});
	}

	async run(message) {
		const images = await loadImage(message.author.username);
		const image = images[0];

		message.channel.send({ files: [ image.url ] });
	}
};

async function loadImage(sub_id, mime = 'jpg, png') {
	const url = 'https://api.thedogapi.com/';
	const headers = {
		'x-api-key': process.env.CAT_API,
	};

	const query = {
		'has_breeds': true,
		'mime_types': mime,
		'size': 'med',
		'sub_id': sub_id,
		'limit': 1,
	};
	const queryString = querystring.stringify(query);

	try {
		return await r2.get(`${url}v1/images/search?${queryString}`, { headers }).json;
	}
	catch (err) {
		console.log(err);
	}
}