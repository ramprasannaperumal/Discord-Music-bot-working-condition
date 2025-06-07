const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { queue } = require('../../queue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume paused music'),

  async execute(interaction) {
    const serverQueue = queue.get(interaction.guild.id);
    if (!serverQueue || serverQueue.player?.state.status !== AudioPlayerStatus.Paused) {
      return interaction.reply({ content: '❌ Nothing is paused.', ephemeral: true });
    }

    serverQueue.player.unpause();
    return interaction.reply('▶️ Resumed.');
  }
};
