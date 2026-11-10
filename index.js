const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType, ActivityType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers // Required to assign roles when clicked
  ] 
});

// Define all Moderator, Owner, Verification, and Community commands
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
    .setDescription('Open a live real-time dashboard tracking bot health, uptime, and ping'),

  // 10. Setup Verification Panel Command (Owner/Moderator Only)
  new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Post the interactive verification panel (Owner/Moderator only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // 11. Recommend / Suggestion Command (Available to Everyone)
  new SlashCommandBuilder()
    .setName('recommend')
    .setDescription('Submit a recommendation or idea for the server')
    .addStringOption(option =>
      option.setName('idea')
        .setDescription('Your suggestion or recommendation')
        .setRequired(true)),

  // 12. Poll Command (Owner/Moderator Only)
  new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a community poll (Owner/Moderator only)')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('The poll question')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  // 13. Server Info Command (Available to Everyone)
  new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('View server statistics and details'),

  // 14. Random Phoenix Reffaella Image Command (Available to Everyone)
  new SlashCommandBuilder()
    .setName('phoenix')
    .setDescription('Get a random image of Phoenix Reffaella from Zenless Zone Zero!')
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

// Assigned Member Role ID
const VERIFIED_ROLE_ID = '1568576471440556115';

// Interaction Handler (Slash commands & Buttons)
client.on('interactionCreate', async interaction => {
  
  // Handle Button Clicks (Verification button can be clicked by regular members)
  if (interaction.isButton()) {
    if (interaction.customId === 'verify_button') {
      const member = interaction.member;

      if (!member) {
        return await interaction.reply({ content: '❌ Could not verify your membership.', ephemeral: true });
      }

      // Check if user already has the role
      if (member.roles.cache.has(VERIFIED_ROLE_ID)) {
        return await interaction.reply({ content: '⚠️ You are already verified!', ephemeral: true });
      }

      try {
        await member.roles.add(VERIFIED_ROLE_ID);
        return await interaction.reply({ content: '✅ **Success!** You have been verified and given access to the server.', ephemeral: true });
      } catch (error) {
        console.error('Failed to assign verified role:', error);
        return await interaction.reply({ content: '❌ Failed to assign the role. Please contact a server admin.', ephemeral: true });
      }
    }
  }

  if (!interaction.isChatInputCommand()) return;

  const { commandName, member, guild, client, user } = interaction;

  // 1. Real-Time Bot Health Dashboard (/botstatus) - Available to everyone
  if (commandName === 'botstatus') {
    await interaction.deferReply();

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

    await interaction.editReply({ embeds: [generateStatusEmbed()] });

    let counter = 0;
    const interval = setInterval(async () => {
      counter++;
      if (counter > 24) { 
        clearInterval(interval);
        return;
      }

      try {
        await interaction.editReply({ embeds: [generateStatusEmbed()] });
      } catch (err) {
        clearInterval(interval);
      }
    }, 5000);

    return;
  }

  // 2. Recommend / Suggestion Command (Available to Everyone)
  if (commandName === 'recommend') {
    const ideaText = interaction.options.getString('idea');

    const embed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setTitle('💡 New Server Recommendation')
      .setDescription(ideaText)
      .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    const suggestionMessage = await interaction.channel.send({ embeds: [embed] });
    await suggestionMessage.react('👍');
    await suggestionMessage.react('👎');

    return await interaction.reply({ content: '✅ Your recommendation has been submitted successfully!', ephemeral: true });
  }

  // 3. Server Info Command (Available to Everyone)
  if (commandName === 'serverinfo') {
    const owner = await guild.fetchOwner();
    
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`📊 Server Info: ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: 'Server Owner', value: owner.user.tag, inline: true },
        { name: 'Total Members', value: `${guild.memberCount}`, inline: true },
        { name: 'Server Boosts', value: `${guild.premiumSubscriptionCount || 0} Boosts`, inline: true },
        { name: 'Created On', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false }
      )
      .setFooter({ text: `Requested by ${user.tag}` })
      .setTimestamp();

    return await interaction.reply({ embeds: [embed] });
  }

  // 4. Random Phoenix Reffaella Image Command (Available to Everyone)
  if (commandName === 'phoenix') {
    const phoenixImages = [
      'https://images.contentstack.io/v3/assets/blted40862176b66fa7/blt68b201d4a0a1b24e/phoenix_zzzy.png',
      'https://static.wikia.nocookie.net/zenless-zone-zero/images/b/b8/Phoenix_Reffaella_Portrait.png'
    ];

    const randomImage = phoenixImages[Math.floor(Math.random() * phoenixImages.length)];

    const embed = new EmbedBuilder()
      .setColor(0xFF4500)
      .setTitle('🔥 Phoenix Reffaella — Zenless Zone Zero')
      .setDescription('*"I\'m Phoenix, one of Krampus\'s... judge, of sorts. Standing around\'s a little tiring — mind if I sit?"*')
      .setImage(randomImage)
      .addFields(
        { name: 'Faction', value: 'Krampus Compliance Authority', inline: true },
        { name: 'Attribute / Specialty', value: 'Fire / Anomaly (S-Rank)', inline: true }
      )
      .setFooter({ text: `Requested by ${user.tag}` })
      .setTimestamp();

    return await interaction.reply({ embeds: [embed] });
  }

  // Security Gate: Check if user has Owner or Moderator role for all staff/management commands below
  if (!hasAllowedRole(member)) {
    return await interaction.reply({
      content: '❌ You must have the **Owner** or **Moderator** role to use this command.',
      ephemeral: true
    });
  }

  // 5. Setup Verification Panel (/verify) - Owner & Moderator Only
  if (commandName === 'verify') {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🛡️ Server Verification')
      .setDescription('Click the **Verify** button below to gain access to the rest of the server!');

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('verify_button')
          .setLabel('Verify')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅')
      );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    return await interaction.reply({ content: '✅ Verification panel posted successfully!', ephemeral: true });
  }

  // 6. Poll Command (Owner & Moderator Only)
  if (commandName === 'poll') {
    const questionText = interaction.options.getString('question');

    const embed = new EmbedBuilder()
      .setColor(0xEB459E)
      .setTitle('📊 Community Poll')
      .setDescription(questionText)
      .setFooter({ text: `Poll created by ${user.tag}` })
      .setTimestamp();

    const pollMessage = await interaction.channel.send({ embeds: [embed] });
    await pollMessage.react('👍');
    await pollMessage.react('👎');
    await pollMessage.react('🤷');

    return await interaction.reply({ content: '✅ Poll created successfully!', ephemeral: true });
  }

  // 7. Status Presence Command Logic (Owner & Moderator Only)
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

  // 8. Announce Command Logic
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

          if (attachment) {
            embed.setImage(attachment.url);
          }

          await channel.send({ embeds: [embed] });
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

  // 9. Userinfo Command Logic
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

  // 10. Kick Command Logic
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

  // 11. Ban Command Logic
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

  // 12. Clear Command Logic
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

  // 13. Timeout Command Logic
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

  // 14. DM Command Logic
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