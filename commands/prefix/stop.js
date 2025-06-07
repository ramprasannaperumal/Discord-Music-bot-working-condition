const queue = require('../../queue');

module.exports = {
  name: 'stop',
  description: 'Stop the current song and clear the queue',
  async execute(message) {
    const serverQueue = queue.get(message.guild.id);

    if (!serverQueue) {
      return message.reply('❌ There is no song to stop.');
    }

    serverQueue.songs = [];
    serverQueue.player.stop(); // Stop playback
    queue.delete(message.guild.id);

    message.channel.send('⏹️ Stopped and cleared the queue.');
  }
};
