const { Command } = require('discord.js-commando');
require('dotenv').config();
const querystring = require('query-string');
const r2 = require('r2');

module.exports = class CatCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'cat',
			aliases: ['pusa', 'cats'],
			group: 'animals',
			memberName: 'cat',
			description: 'Meow.',
		});
	}

	async run(message, args) {
		const images = await loadImage(message.author.username, args);
		const image = images[0];

		message.channel.send({ files: [ image.url ] });
	}
};

async function loadImage(sub_id, mime = 'jpg, png') {
	const url = 'https://api.thecatapi.com/';
	const headers = {
		'x-api-key': process.env.CAT_API,
	};

	const query = {
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