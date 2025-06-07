const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');
const playdl = require('play-dl');

// ✅ Correct path and export for shared queue
const queue = require('../../queue'); // NOT destructured

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from YouTube or Spotify')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Song name, YouTube or Spotify link')
        .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString('query');
    const member = interaction.member;

    if (!member.voice.channel) {
      return interaction.reply({ content: '🔊 You need to join a voice channel first!', ephemeral: true });
    }

    const voiceChannel = member.voice.channel;
    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return interaction.reply({ content: '❌ I need permissions to join and speak in your voice channel!', ephemeral: true });
    }

    let songUrl = '';
    let songTitle = '';

    try {
      if (ytdl.validateURL(query)) {
        songUrl = query;
        const info = await ytdl.getInfo(query);
        songTitle = info.videoDetails.title;
      } else {
        const results = await playdl.search(query, { limit: 1 });
        if (!results.length) return interaction.reply({ content: '❌ No song found.', ephemeral: true });
        songUrl = results[0].url;
        songTitle = results[0].title;
      }

      await interaction.reply(`🔍 Found: **${songTitle}**`);

    } catch (e) {
      console.error(e);
      return interaction.reply({ content: '❌ Error while searching for the song.', ephemeral: true });
    }

    const song = { title: songTitle, url: songUrl };

    let serverQueue = queue.get(interaction.guild.id);

    if (serverQueue) {
      serverQueue.songs.push(song);
      return interaction.followUp({ content: `🎶 **Added to queue:** ${song.title}` });
    }

    const queueConstruct = {
      textChannel: interaction.channel,
      voiceChannel,
      connection: null,
      player: null,
      songs: [song],
      previous: null,
      playing: true,
      loop: false,
      checkMuteInterval: null
    };

    queue.set(interaction.guild.id, queueConstruct);

    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
        selfDeaf: false
      });

      connection.on('stateChange', (oldState, newState) => {
        if (oldState.status === 'ready' && newState.status === 'disconnected') {
          queueConstruct.textChannel.send('❌ Bot disconnected from the voice channel.');
          queue.delete(interaction.guild.id);
        }
      });

      queueConstruct.connection = connection;
      playSong(interaction.guild.id);
    } catch (error) {
      console.error(error);
      queue.delete(interaction.guild.id);
      return interaction.followUp({ content: '❌ Failed to join the voice channel.', ephemeral: true });
    }
  }
};

async function playSong(guildId) {
  const serverQueue = queue.get(guildId);
  if (!serverQueue || serverQueue.songs.length === 0) {
    if (serverQueue?.connection) {
      setTimeout(() => {
        const freshQueue = queue.get(guildId);
        if (!freshQueue || freshQueue.songs.length === 0) {
          serverQueue.connection.destroy();
          queue.delete(guildId);
          clearInterval(serverQueue.checkMuteInterval);
        }
      }, 5000);
    }
    return;
  }

  const song = serverQueue.songs[0];

  try {
    const stream = ytdl(song.url, {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25,
    });

    const resource = createAudioResource(stream);
    const player = createAudioPlayer();

    player.play(resource);
    serverQueue.connection.subscribe(player);
    serverQueue.player = player;

    serverQueue.textChannel.send(`🎶 Now playing: **${song.title}**`);

    serverQueue.checkMuteInterval = setInterval(() => {
      const selfMember = serverQueue.voiceChannel.guild.members.me;
      if (!selfMember || !selfMember.voice) return;

      if (selfMember.voice.serverMute && serverQueue.player.state.status !== 'paused') {
        serverQueue.player.pause();
        serverQueue.textChannel.send('🔇 Server muted bot — music paused.');
      } else if (!selfMember.voice.serverMute && serverQueue.player.state.status === 'paused') {
        serverQueue.player.unpause();
        serverQueue.textChannel.send('🔊 Bot unmuted — resuming music.');
      }
    }, 3000);

    player.on(AudioPlayerStatus.Idle, () => {
      if (serverQueue.loop) {
        serverQueue.songs.push(serverQueue.songs.shift());
      } else {
        serverQueue.previous = serverQueue.songs.shift();
      }
      playSong(guildId);
    });

    player.on('error', (error) => {
      console.warn('⚠️ Stream error:', error.message);
      serverQueue.textChannel.send('⚠️ Minor error occurred, skipping song.');
      serverQueue.previous = serverQueue.songs.shift();
      playSong(guildId);
    });
  } catch (error) {
    console.error('❌ Stream error:', error);
    serverQueue.textChannel.send('❌ Error while streaming the song.');
    serverQueue.previous = serverQueue.songs.shift();
    playSong(guildId);
  }
}
