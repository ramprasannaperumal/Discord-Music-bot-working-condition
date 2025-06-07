const queue = require('../../queue'); // ✅ FIXED

module.exports = {
  name: 'pause',
  description: 'Pauses the currently playing music',

  async execute(message, args) {
    const serverQueue = queue.get(message.guild.id);

    if (!serverQueue) {
      return message.reply('❌ There is no music playing to pause.');
    }

    if (!serverQueue.player) {
      return message.reply('❌ Music player is not initialized.');
    }

    const status = serverQueue.player.state.status;

    if (status === 'paused') {
      return message.reply('⏸️ Music is already paused.');
    }

    try {
      serverQueue.player.pause();
      return message.channel.send('⏸️ Music paused.');
    } catch (error) {
      console.error('Pause Error:', error);
      return message.reply('❌ Failed to pause the music.');
    }
  }
};
