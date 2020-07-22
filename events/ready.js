const index = require('../index.js')
const client = index.client;
module.exports = {
	run: () => {
		console.log(`Logged in as ${client.user.tag}! (${client.user.id})`);
		client.user.setPresence({
			status: 'online',
			activity: {
				name: 'Netflix with Nord VPN',
				type: 'WATCHING',
				url: 'https://www.twitch.tv/mrmoo_linux'
			},
			clientStatus: 'Test'
		})
		.catch(console.error);
	}
}