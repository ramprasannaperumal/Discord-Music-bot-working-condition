const queue = require('../../queue');

module.exports = {
  name: 'loop',
  description: 'Toggle loop for current song',

  async execute(message) {
    const serverQueue = queue.get(message.guild.id);

    if (!serverQueue) return message.reply('❌ Nothing is playing.');

    serverQueue.loop = !serverQueue.loop;
    message.channel.send(serverQueue.loop ? '🔁 Loop enabled.' : '➡️ Loop disabled.');
  }
};
