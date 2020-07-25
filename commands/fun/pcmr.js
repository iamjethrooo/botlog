const fetch = require('node-fetch');
const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

module.exports = class ChuckNorrisCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'pcmr',
			group: 'fun',
			memberName: 'pcmr',
			description: 'Get a random top post from the PCMR subreddit.',
			throttling: {
				usages: 1,
				duration: 6,
			},
		});
	}

	run(message, args) {
		fetch('https://www.reddit.com/r/pcmasterrace/top.json?sort=top', {
			method: 'GET',
		})
			.then(res => res.json())
			.then(json => {
				let num;
				if (args.length > 1) {
					num = args.split(' ')[0];
				} else {
					num = Math.floor(Math.random() * json.data.dist);
				}
				const post = json.data.children[num].data;
				console.log(post.url_overridden_by_dest);
				console.log(post.subreddit_name_prefixed);
				const embed = new MessageEmbed()
					.setTitle(post.title)
					.setAuthor(`u/${post.author}`)
					.setURL(`https://www.reddit.com${post.permalink}`)
					.setImage(post.url_overridden_by_dest)
					.setFooter(`👍${post.ups} 👎${Math.floor(post.ups - (post.ups * post.upvote_ratio))}`);
				return message.say(embed);
			})
			.catch(err => {
				message.say('An error occured!');
				return console.error(err);
			});
	}
};