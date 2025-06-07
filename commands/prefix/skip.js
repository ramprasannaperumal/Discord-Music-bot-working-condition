// commands/prefix/skip.js
const queue = require('../../queue');

module.exports = {
  name: 'skip',
  description: 'Skip the current song',
  async execute(message) {
    const serverQueue = queue.get(message.guild.id);

    if (!serverQueue) {
      return message.reply('❌ There is no song to skip.');
    }

    serverQueue.player.stop(); // stops current song, triggers 'finish' to play next
    message.channel.send('⏭️ Skipped!');
  },
};
