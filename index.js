require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const prefix = process.env.PREFIX;

// Collections
client.prefixCommands = new Collection();
client.slashCommands = new Collection();

// Load prefix commands
const prefixCommandFiles = fs.readdirSync('./commands/prefix').filter(file => file.endsWith('.js'));
for (const file of prefixCommandFiles) {
  const command = require(`./commands/prefix/${file}`);
  client.prefixCommands.set(command.name, command);
}

// Load slash commands
const slashCommandFiles = fs.readdirSync('./commands/slash').filter(file => file.endsWith('.js'));
const slashCommandsForRegister = [];
for (const file of slashCommandFiles) {
  const command = require(`./commands/slash/${file}`);
  client.slashCommands.set(command.data.name, command);
  slashCommandsForRegister.push(command.data.toJSON());
}

// Ready event
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    console.log('🚀 Started refreshing application (/) commands.');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: slashCommandsForRegister },
    );
    console.log('✅ Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('❌ Error registering slash commands:', error);
  }
});

// Prefix command handler
client.on('messageCreate', async message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.prefixCommands.get(commandName); // ✅ fixed
  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (error) {
    console.error('❌ Error executing prefix command:', error);
    message.reply('❌ There was an error executing that command.');
  }
});

// Slash command handler
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.slashCommands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error('❌ Error executing slash command:', error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: '❌ Error executing that command.', ephemeral: true });
    } else {
      await interaction.reply({ content: '❌ Error executing that command.', ephemeral: true });
    }
  }
});

// Login
client.login(process.env.TOKEN);
