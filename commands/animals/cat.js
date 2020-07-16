const { Command } = require('discord.js-commando');
const { the_cat_api } = require('../../config.json');
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
  	console.log(args);
    let images = await loadImage(message.author.username, args);
    console.log(images);
    let image = images[0];

    message.channel.send({files: [ image.url ] } );
  }
};

async function loadImage(sub_id, mime = 'jpg, png') {
	const url = 'https://api.thecatapi.com/';
	const headers = {
		'x-api-key': 'the_cat_api'
	}

	let query = {
		'mime_types': mime,
		'size': 'med',
		'sub_id': sub_id,
		'limit': 1
	}
	const queryString = querystring.stringify(query);
	console.log(queryString);

	try {
		return await r2.get(`${url}v1/images/search?${queryString}`, {headers}).json
	} catch (err) {
		console.log(e);
	}
}