const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus
} = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');
const playdl = require('play-dl');
const queue = require('../../queue'); // ✅ fixed import

module.exports = {
  name: 'play',
  description: 'Play music from YouTube',
  async execute(message, args) {
    const query = args.join(' ');
    if (!query) return message.reply('❌ Provide a song name or link.');

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('🔊 Join a voice channel first.');

    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return message.reply('❌ I need permissions to join and speak in your VC.');
    }

    let songUrl = '';
    if (ytdl.validateURL(query)) {
      songUrl = query;
    } else {
      const results = await playdl.search(query, { limit: 1 });
      if (!results.length) return message.reply('❌ No results found.');
      songUrl = results[0].url;
      message.channel.send(`🔍 Found: **${results[0].title}**`);
    }

    const song = {
      title: songUrl,
      url: songUrl,
    };

    let serverQueue = queue.get(message.guild.id);

    if (serverQueue) {
      serverQueue.songs.push(song);
      return message.channel.send(`🎶 Added to queue: ${song.title}`);
    }

    const queueConstruct = {
      textChannel: message.channel,
      voiceChannel,
      connection: null,
      player: null,
      songs: [song],
      previous: null,
      playing: true,
      loop: false,
    };

    queue.set(message.guild.id, queueConstruct);

    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
        selfDeaf: false,
      });

      queueConstruct.connection = connection;

      connection.on('stateChange', (oldState, newState) => {
        if (oldState.status === 'ready' && newState.status === 'disconnected') {
          queueConstruct.textChannel.send('📤 Bot was disconnected from VC.');
          queue.delete(message.guild.id);
        }
      });

      playSong(message.guild.id);
    } catch (err) {
      console.error(err);
      queue.delete(message.guild.id);
      return message.channel.send('❌ Could not join VC.');
    }
  }
};

async function playSong(guildId) {
  const queue = require('../../queue'); // ✅ fixed import again
  const serverQueue = queue.get(guildId);
  if (!serverQueue || serverQueue.songs.length === 0) {
    if (serverQueue?.connection) {
      setTimeout(() => {
        const freshQueue = queue.get(guildId);
        if (!freshQueue || freshQueue.songs.length === 0) {
          serverQueue.connection.destroy();
          queue.delete(guildId);
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

    serverQueue.textChannel.send(`🎧 Now playing: ${song.url}`);

    const checkMute = () => {
      const botMember = serverQueue.voiceChannel.guild.members.me;
      if (botMember.voice.serverMute && !player.paused) {
        player.pause();
        serverQueue.textChannel.send('🔇 Bot muted, pausing music.');
      } else if (!botMember.voice.serverMute && player.paused) {
        player.unpause();
        serverQueue.textChannel.send('🔊 Bot unmuted, resuming music.');
      }
    };

    const interval = setInterval(() => {
      if (!serverQueue.connection || serverQueue.songs.length === 0) return clearInterval(interval);
      checkMute();
    }, 2000);

    player.on(AudioPlayerStatus.Idle, () => {
      if (serverQueue.loop) {
        serverQueue.songs.push(serverQueue.songs.shift());
      } else {
        serverQueue.previous = serverQueue.songs.shift();
      }
      playSong(guildId);
    });

    player.on('error', (err) => {
      console.warn('⚠️ Audio error:', err.message);
      serverQueue.textChannel.send('⚠️ Skipping song due to error.');
      serverQueue.previous = serverQueue.songs.shift();
      playSong(guildId);
    });
  } catch (err) {
    console.error('❌ Streaming failed:', err);
    serverQueue.textChannel.send('❌ Failed to play song.');
    serverQueue.previous = serverQueue.songs.shift();
    playSong(guildId);
  }
}
