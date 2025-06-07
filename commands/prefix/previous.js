const queue = require('../../queue'); // ✅ Properly import the shared queue

module.exports = {
  name: 'previous',
  description: 'Play the previous song in the queue',

  async execute(message, args) {
    const serverQueue = queue.get(message.guild.id);

    if (!serverQueue) return message.reply('❌ No song is currently playing.');
    if (!serverQueue.previous) return message.reply('❌ No previous song to play.');

    // Check if previous song is same as current to avoid rewind loop
    if (serverQueue.songs.length > 0 && serverQueue.songs[0].url === serverQueue.previous.url) {
      return message.reply('❌ Already playing the previous song.');
    }

    // Put previous song at front of queue
    serverQueue.songs.unshift(serverQueue.previous);

    // Clear previous to avoid infinite rewind loop
    serverQueue.previous = null;

    // Stop current player to trigger playSong again
    if (serverQueue.player) {
      serverQueue.player.stop(true);
    }

    return message.reply('⏮️ Playing previous song...');
  }
};
