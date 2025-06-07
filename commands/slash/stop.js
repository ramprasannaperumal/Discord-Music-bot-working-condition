const { SlashCommandBuilder } = require('discord.js');
const { queue } = require('../../queue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the music and clear the queue'),

  async execute(interaction) {
    const serverQueue = queue.get(interaction.guild.id);

    if (!serverQueue) {
      return interaction.reply({ content: '❌ Nothing is currently playing.', ephemeral: true });
    }

    serverQueue.songs = [];
    serverQueue.player.stop(); // Will trigger AudioPlayerStatus.Idle
    return interaction.reply('⏹️ Music stopped and queue cleared.');
  }
};
