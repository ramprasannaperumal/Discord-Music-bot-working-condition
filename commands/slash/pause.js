const { SlashCommandBuilder } = require('discord.js');
const queue = require('../../queue'); // 🔁 Correctly import the queue

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('⏸️ Pause the current music'),

  async execute(interaction) {
    const serverQueue = queue.get(interaction.guild.id); // 💥 Fixes the "undefined" error

    if (!serverQueue || !serverQueue.player) {
      return interaction.reply({ content: '❌ No music is playing.', ephemeral: true });
    }

    try {
      serverQueue.player.pause();
      await interaction.reply('⏸️ Paused the music.');
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '⚠️ Failed to pause music.', ephemeral: true });
    }
  }
};
