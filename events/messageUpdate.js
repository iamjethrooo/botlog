const index = require('../index.js');
const client = index.client;

client.editsnipes = {
  get: function(ChannelId) {
    return this[ChannelId];
  },
  set: function(msg) {
    this[msg.channel.id] = msg;
  }
}

module.exports = {
	run: message => {
		if (message.author.bot) return;
		client.editsnipes.set(message);
	}
}
