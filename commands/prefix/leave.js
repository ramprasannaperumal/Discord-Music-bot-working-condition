const queue = require('../../queue');

module.exports = {
  name: 'leave',
  description: 'Disconnect the bot from the voice channel',

  async execute(message) {
    const serverQueue = queue.get(message.guild.id);

    if (!serverQueue || !serverQueue.connection) {
      return message.reply('❌ I am not in a voice channel.');
    }

    serverQueue.connection.destroy();
    queue.delete(message.guild.id);

    message.channel.send('👋 Disconnected from the voice channel.');
  }
};
