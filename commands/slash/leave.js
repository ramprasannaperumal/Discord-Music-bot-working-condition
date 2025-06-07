const { SlashCommandBuilder } = require('discord.js');
const { queue } = require('../../queue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Disconnect the bot from the voice channel'),

  async execute(interaction) {
    const serverQueue = queue.get(interaction.guild.id);

    if (!serverQueue || !serverQueue.connection) {
      return interaction.reply({ content: '❌ I am not in a voice channel.', ephemeral: true });
    }

    serverQueue.connection.destroy();
    queue.delete(interaction.guild.id);

    return interaction.reply('👋 Disconnected from the voice channel.');
  }
};

