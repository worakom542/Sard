const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType, ActivityType } = require('discord.js');
const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ] 
});

// Define all Moderator and Owner commands including the real-time bot status dashboard
const commands = [
  // 1. Kick Command
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server (Owner/Moderator only)')
    .addUserOption(option => 
      option.setName('target')
        .setDescription('The member to kick')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason for kicking'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  // 2. Ban Command
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server (Owner/Moderator only)')
    .addUserOption(option => 
      option.setName('target')
        .setDescription('The member to ban')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason for banning'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  // 3. Clear/Purge Messages Command
  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Delete a specified number of messages (Owner/Moderator only)')
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  // 4. Timeout Command
  new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a member for a specified duration (Owner/Moderator only)')
    .addUserOption(option => 
      option.setName('target')
        .setDescription('The member to timeout')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('minutes')
        .setDescription('Duration of timeout in minutes')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason for timeout'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  // 5. Send Direct Message Command
  new SlashCommandBuilder()
    .setName('dm')
    .setDescription('Send a direct message & file/image to a server member (Owner/Moderator only)')
    .addUserOption(option => 
      option.setName('target')
        .setDescription('The member to send a DM to')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('message')
        .setDescription('The message content to send')
        .setRequired(true))
    .addAttachmentOption(option =>
      option.setName('attachment')
        .setDescription('Optional image, GIF, or file to attach')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  // 6. View User Profile by ID Command (Owner & Moderator Only)
  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('View any Discord user profile using their User ID (Owner/Moderator only)')
    .addStringOption(option => 
      option.setName('userid')
        .setDescription('The Discord User ID to look up')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  // 7. Announcement Command
  new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send an announcement & file to all categorized text channels (Owner/Moderator only)')
    .addStringOption(option => 
      option.setName('message')
        .setDescription('The announcement message to broadcast')
        .setRequired(true))
    .addAttachmentOption(option =>
      option.setName('attachment')
        .setDescription('Optional image, GIF, or file to attach')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // 8. Change Presence Status Command (Owner & Moderator Only)
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Change the bot presence status and activity (Owner/Moderator only)')
    .addStringOption(option =>
      option.setName('presence')
        .setDescription('The status mode')
        .setRequired(true)
        .addChoices(
          { name: 'Online', value: 'online' },
          { name: 'Idle', value: 'idle' },
          { name: 'Do Not Disturb', value: 'dnd' },
          { name: 'Invisible', value: 'invisible' }
        ))
    .addStringOption(option =>
      option.setName('activity')
        .setDescription('What the bot is playing/watching')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // 9. Real-Time Bot Operational Health & Live Dashboard
  new SlashCommandBuilder()
    .setName('botstatus')
    .setDescription('Open a live real-time dashboard tracking bot health, uptime, and ping')
].map(command => command.toJSON());

// Register commands via REST API
const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Registering commands...');
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );
    console.log('Commands successfully registered!');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
})();

// Helper function to check if user is the Server Owner or has a role named "Owner"
function isOwner(member) {
  if (member.guild.ownerId === member.id) return true;
  return member.roles.cache.some(role => role.name.toLowerCase() === 'owner');
}

// Helper function to check for "Owner" or "Moderator" role
function hasAllowedRole(member) {
  if (isOwner(member)) return true;
  
  return member.roles.cache.some(role => 
    role.name.toLowerCase() === 'owner' || role.name.toLowerCase() === 'moderator'
  );
}

// Command Handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, member, guild, client } = interaction;

  // 1. Real-Time Bot Health Dashboard (/botstatus) - Available to everyone
  if (commandName === 'botstatus') {
    await interaction.deferReply();

    // Function to generate fresh status stats
    const generateStatusEmbed = () => {
      const totalSeconds = Math.floor(client.uptime / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

      return new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('🟢 Real-Time Bot Status Dashboard')
        .addFields(
          { name: 'System State', value: '🟢 Fully Operational & Working', inline: true },
          { name: 'API Latency', value: `🏓 ${Math.round(client.ws.ping)}ms`, inline: true },
          { name: 'Memory Usage', value: `💾 ${memoryUsage} MB`, inline: true },
          { name: 'Uptime', value: `⏱️ ${hours}h ${minutes}m ${seconds}s`, inline: false }
        )
        .setFooter({ text: 'Live updating every 5 seconds...' })
        .setTimestamp();
    };

    // Send initial response
    await interaction.editReply({ embeds: [generateStatusEmbed()] });

    // Set up a real-time interval to edit and refresh stats every 5 seconds for 2 minutes
    let counter = 0;
    const interval = setInterval(async () => {
      counter++;
      if (counter > 24) { // Stops after 2 minutes (24 * 5 seconds) to prevent infinite API loops
        clearInterval(interval);
        return;
      }

      try {
        await interaction.editReply({ embeds: [generateStatusEmbed()] });
      } catch (err) {
        clearInterval(interval); // Stop if message or interaction expires
      }
    }, 5000);

    return;
  }

  // Security Gate: Check if user has Owner or Moderator role for all remaining staff commands
  if (!hasAllowedRole(member)) {
    return await interaction.reply({
      content: '❌ You must have the **Owner** or **Moderator** role to use this command.',
      ephemeral: true
    });
  }

  // 2. Status Presence Command Logic (Owner & Moderator Only)
  if (commandName === 'status') {
    const presenceMode = interaction.options.getString('presence');
    const activityText = interaction.options.getString('activity');

    try {
      await client.user.setPresence({
        activities: [{ name: activityText, type: ActivityType.Playing }],
        status: presenceMode
      });

      return await interaction.reply({
        content: `✅ Bot presence successfully updated!\n> **Status:** ${presenceMode}\n> **Activity:** Playing ${activityText}`,
        ephemeral: true
      });
    } catch (error) {
      console.error(error);
      return await interaction.reply({
        content: '❌ Failed to update bot status.',
        ephemeral: true
      });
    }
  }

  // 3. Announce Command Logic
  if (commandName === 'announce') {
    const announcementText = interaction.options.getString('message');
    const attachment = interaction.options.getAttachment('attachment');
    await interaction.deferReply({ ephemeral: true });

    let sentCount = 0;
    const channels = await guild.channels.fetch();

    for (const [id, channel] of channels) {
      if (channel && channel.type === ChannelType.GuildText && channel.parentId) {
        try {
          const embed = new EmbedBuilder()
            .setColor(0xFEE75C)
            .setTitle('📢 Server Announcement')
            .setDescription(announcementText)
            .setFooter({ text: `Announced by ${interaction.user.tag}` })
            .setTimestamp();

          const messageOptions = { embeds: [embed] };
          if (attachment) {
            embed.setImage(attachment.url);
          }

          await channel.send(messageOptions);
          sentCount++;
        } catch (err) {
          console.error(`Failed to send announcement to channel ${channel.name}:`, err);
        }
      }
    }

    return await interaction.editReply({
      content: `✅ Announcement successfully broadcasted to **${sentCount}** categorized channels!`
    });
  }

  // 4. Userinfo Command Logic
  if (commandName === 'userinfo') {
    const userId = interaction.options.getString('userid').trim();
    await interaction.deferReply({ ephemeral: true });

    try {
      const targetUser = await client.users.fetch(userId, { force: true });

      if (!targetUser) {
        return await interaction.editReply('❌ Could not find a user with that ID.');
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`👤 User Profile: ${targetUser.tag}`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
        .addFields(
          { name: 'Username', value: targetUser.username, inline: true },
          { name: 'User ID', value: targetUser.id, inline: true },
          { name: 'Bot Account?', value: targetUser.bot ? 'Yes 🤖' : 'No 👤', inline: true },
          { name: 'Account Created', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`, inline: false }
        )
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();

      if (targetUser.banner) {
        const bannerUrl = targetUser.bannerURL({ size: 1024, dynamic: true });
        embed.setImage(bannerUrl);
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.editReply('❌ Failed to fetch user profile. Make sure you entered a valid 18-digit Discord User ID.');
    }
    return;
  }

  // 5. Kick Command Logic
  if (commandName === 'kick') {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      return await interaction.reply({ content: 'That user is not in this server.', ephemeral: true });
    }

    if (!targetMember.kickable) {
      return await interaction.reply({ content: '❌ Cannot kick this user (they may have higher permissions than the bot).', ephemeral: true });
    }

    await targetMember.kick(reason);
    await interaction.reply({ content: `✅ Kicked **${targetUser.tag}** | Reason: ${reason}` });
  }

  // 6. Ban Command Logic
  else if (commandName === 'ban') {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

    if (targetMember && !targetMember.bannable) {
      return await interaction.reply({ content: '❌ Cannot ban this user (they may have higher permissions than the bot).', ephemeral: true });
    }

    await guild.members.ban(targetUser, { reason });
    await interaction.reply({ content: `⛔ Banned **${targetUser.tag}** | Reason: ${reason}` });
  }

  // 7. Clear Command Logic
  else if (commandName === 'clear') {
    const amount = interaction.options.getInteger('amount');

    if (amount < 1 || amount > 100) {
      return await interaction.reply({ content: 'Please specify a number between 1 and 100.', ephemeral: true });
    }

    const deleted = await interaction.channel.bulkDelete(amount, true).catch(err => {
      console.error(err);
      return null;
    });

    if (!deleted) {
      return await interaction.reply({ content: '❌ Failed to delete messages. (Messages older than 14 days cannot be bulk deleted).', ephemeral: true });
    }

    await interaction.reply({ content: `🧹 Deleted **${deleted.size}** messages.`, ephemeral: true });
  }

  // 8. Timeout Command Logic
  else if (commandName === 'timeout') {
    const targetUser = interaction.options.getUser('target');
    const minutes = interaction.options.getInteger('minutes');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      return await interaction.reply({ content: 'That user is not in this server.', ephemeral: true });
    }

    if (!targetMember.moderatable) {
      return await interaction.reply({ content: '❌ Cannot timeout this user (they may have higher permissions than the bot).', ephemeral: true });
    }

    try {
      const durationMs = minutes * 60 * 1000;
      await targetMember.timeout(durationMs, reason);
      await interaction.reply({ content: `⏳ Timed out **${targetUser.tag}** for **${minutes} minute(s)** | Reason: ${reason}` });
    } catch (error) {
      console.error(error);
      return await interaction.reply({ content: '❌ Failed to timeout this user.', ephemeral: true });
    }
  }

  // 9. DM Command Logic
  else if (commandName === 'dm') {
    const targetUser = interaction.options.getUser('target');
    const messageContent = interaction.options.getString('message');
    const attachment = interaction.options.getAttachment('attachment');
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      return await interaction.reply({ 
        content: '❌ That user is not a member of this server.', 
        ephemeral: true 
      });
    }

    try {
      const dmPayload = {
        content: `📩 **Message from server moderation (${guild.name}):**\n${messageContent}`
      };

      if (attachment) {
        dmPayload.files = [attachment.url];
      }

      await targetUser.send(dmPayload);
      await interaction.reply({ 
        content: `✅ Successfully sent a direct message to **${targetUser.tag}**.`, 
        ephemeral: true 
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({ 
        content: '❌ Could not send a DM to this user. They might have direct messages disabled or have blocked the bot.', 
        ephemeral: true 
      });
    }
  }
});

client.once('ready', () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

client.login(token);