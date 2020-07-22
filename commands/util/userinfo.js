const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const moment = require("moment");
const getMember = require('../../modules/search-user.js');

module.exports = class UserInfoCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'userinfo',
			group: 'util',
			memberName: 'userinfo',
			description: 'Displays info about the user.',
			format: '(member)'
		});
	}

	async run(message, args) {
		const member = await getMember(message, args, this.client);
		const randomColor = "#000000".replace(/0/g, function () { return (~~(Math.random() * 16)).toString(16); });
		const embed = new MessageEmbed()
			.setColor(randomColor)
			.setAuthor(`${member.user.tag}`, member.user.displayAvatarURL({ dynamic: true} ))
			.setDescription(`<@${member.user.id}>`)
			.setThumbnail(member.user.displayAvatarURL({ dynamic: true} ))
			.addField('Status', status[member.user.presence.status], true)
			.addField('Joined at: ', moment(member.joinedAt).format('dddd, MMMM Do YYYY, HH:mm:ss'), true)
			.addField('Created at: ', moment(member.user.createdAt).format('dddd, MMMM Do YYYY, HH:mm:ss'), true)
			.addField(`Roles [${member.roles.cache.filter(r => r.id !== message.guild.id).map(roles => `\`${roles.name}\``).length}]`,`${member.roles.cache.filter(r => r.id !== message.guild.id).map(roles => `<@&${roles.id }>`).join(" **|** ") || "No Roles"}`, true)
			.setTimestamp();
		message.say(embed);
	}
};

const status = {
	online: 'Online',
	idle: 'Idle',
	dnd: 'Do Not Disturb',
	offline: 'Offline/Invisible'
}