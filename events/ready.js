const index = require('../index.js')
const client = index.client;
module.exports = {
	run: () => {
		console.log(`Logged in as ${client.user.tag}! (${client.user.id})`);
		client.user.setPresence({
			status: 'online',
			activity: {
				name: 'Among Us',
			},
			clientStatus: 'Test'
		})
		.catch(console.error);
	}
}