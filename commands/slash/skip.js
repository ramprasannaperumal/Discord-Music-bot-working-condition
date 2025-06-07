const { SlashCommandBuilder } = require('discord.js');
const { queue } = require('../../queue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song'),

  async execute(interaction) {
    const serverQueue = queue.get(interaction.guild.id);
    if (!serverQueue) {
      return interaction.reply({ content: '❌ No song to skip.', ephemeral: true });
    }

    if (!interaction.member.voice.channel || interaction.member.voice.channel.id !== serverQueue.voiceChannel.id) {
      return interaction.reply({ content: '❌ You must be in the same voice channel as the bot.', ephemeral: true });
    }

    serverQueue.player.stop();
    return interaction.reply('⏭️ Skipped!');
  }
};
