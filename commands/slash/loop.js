const { SlashCommandBuilder } = require('discord.js');
const { queue } = require('../../queue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Toggle looping for the current song'),

  async execute(interaction) {
    const serverQueue = queue.get(interaction.guild.id);
    if (!serverQueue) {
      return interaction.reply({ content: '❌ No song is playing currently.', ephemeral: true });
    }

    serverQueue.loop = !serverQueue.loop;
    return interaction.reply(serverQueue.loop ? '🔁 Looping enabled.' : '➡️ Looping disabled.');
  }
};
