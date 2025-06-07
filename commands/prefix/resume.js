const queue = require('../../queue'); // ✅ Fixed import

module.exports = {
  name: 'resume',
  description: 'Resumes the paused music',

  async execute(message, args) {
    const serverQueue = queue.get(message.guild.id);

    if (!serverQueue) {
      return message.reply('❌ There is no music paused or playing.');
    }

    if (!serverQueue.player) {
      return message.reply('❌ Music player is not initialized.');
    }

    const status = serverQueue.player.state.status;

    if (status === 'playing') {
      return message.reply('▶️ Music is already playing.');
    }

    try {
      serverQueue.player.unpause();
      return message.channel.send('▶️ Music resumed.');
    } catch (error) {
      console.error('Resume Error:', error);
      return message.reply('❌ Failed to resume the music.');
    }
  }
};
