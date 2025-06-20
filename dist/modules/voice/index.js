"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceManager = void 0;
const discord_js_1 = require("discord.js");
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
const permissions_1 = require("@utils/permissions");
const helpers_1 = require("@utils/helpers");
const config_1 = require("@config/config");
const tempChannels_1 = require("./tempChannels");
const controls_1 = require("./controls");
class VoiceManager {
    bot;
    logger;
    tempChannelManager;
    controlManager;
    tempChannels = new Map();
    channelOwners = new Map();
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('VoiceManager');
        this.tempChannelManager = new tempChannels_1.TempChannelManager(bot, this);
        this.controlManager = new controls_1.VoiceControlManager(bot, this);
        this.startCleanupTimer();
    }
    async handleVoiceStateUpdate(oldState, newState) {
        try {
            if (newState.channelId === config_1.config.channels.voiceCreate) {
                await this.tempChannelManager.createTempChannel(newState.member);
                return;
            }
            if (oldState.channel && this.isTempChannel(oldState.channelId)) {
                await this.tempChannelManager.handleUserLeave(oldState);
            }
            if (newState.channel && this.isTempChannel(newState.channelId)) {
                await this.tempChannelManager.handleUserJoin(newState);
            }
            await this.logVoiceActivity(oldState, newState);
        }
        catch (error) {
            this.logger.error('Error handling voice state update:', error);
        }
    }
    async handleButtonInteraction(interaction, params) {
        const [action, channelId] = params;
        try {
            const voiceChannel = interaction.member?.voice?.channel;
            if (!voiceChannel || voiceChannel.id !== channelId) {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Not in Voice Channel', 'You must be in the voice channel to control it.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }
            if (!this.canControlChannel(channelId, interaction.user.id)) {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only the channel owner or staff can control this channel.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }
            await this.controlManager.handleChannelControl(interaction, action, channelId);
        }
        catch (error) {
            this.logger.error('Error handling voice button interaction:', error);
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while processing your request.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
    async createTempChannel(owner, channelName) {
        try {
            const guild = this.bot.client.guilds.cache.first();
            if (!guild)
                return null;
            const category = guild.channels.cache.get(config_1.config.channels.voiceTempCategory);
            const defaultName = `${owner.user.username}'s Room`;
            const tempChannel = await guild.channels.create({
                name: channelName || defaultName,
                type: discord_js_1.ChannelType.GuildVoice,
                parent: category?.id,
                userLimit: 10,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone,
                        allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.Connect],
                        deny: [discord_js_1.PermissionFlagsBits.Speak]
                    },
                    {
                        id: owner.id,
                        allow: [
                            discord_js_1.PermissionFlagsBits.ViewChannel,
                            discord_js_1.PermissionFlagsBits.Connect,
                            discord_js_1.PermissionFlagsBits.Speak,
                            discord_js_1.PermissionFlagsBits.ManageChannels,
                            discord_js_1.PermissionFlagsBits.MoveMembers
                        ]
                    }
                ]
            });
            const tempChannelData = {
                channelId: tempChannel.id,
                ownerId: owner.id,
                createdAt: new Date(),
                lastActivity: new Date(),
                isLocked: false,
                isHidden: false,
                userLimit: 10
            };
            this.tempChannels.set(tempChannel.id, tempChannelData);
            this.channelOwners.set(tempChannel.id, owner.id);
            await owner.voice.setChannel(tempChannel);
            await this.sendChannelControlPanel(tempChannel, owner);
            if (this.bot.channelManager) {
                const logEmbed = embed_1.EmbedManager.createLogEmbed('Temp Voice Channel Created', `${helpers_1.HelperUtils.formatUserTag(owner)} created a temporary voice channel`, [
                    { name: 'Channel', value: tempChannel.name, inline: true },
                    { name: 'Channel ID', value: tempChannel.id, inline: true }
                ]);
                await this.bot.channelManager.sendLog('voiceLogs', logEmbed);
            }
            this.logger.info(`Created temp voice channel: ${tempChannel.name} for ${owner.user.tag}`);
            return tempChannel;
        }
        catch (error) {
            this.logger.error('Failed to create temp channel:', error);
            return null;
        }
    }
    async deleteTempChannel(channelId, reason = 'Auto cleanup') {
        try {
            const tempChannelData = this.tempChannels.get(channelId);
            if (!tempChannelData)
                return false;
            const channel = await this.bot.client.channels.fetch(channelId);
            if (!channel)
                return false;
            if (this.bot.channelManager) {
                const logEmbed = embed_1.EmbedManager.createLogEmbed('Temp Voice Channel Deleted', `Temporary voice channel deleted: ${channel.name}`, [
                    { name: 'Reason', value: reason, inline: true },
                    { name: 'Owner', value: `<@${tempChannelData.ownerId}>`, inline: true },
                    { name: 'Duration', value: this.calculateChannelDuration(tempChannelData), inline: true }
                ]);
                await this.bot.channelManager.sendLog('voiceLogs', logEmbed);
            }
            await channel.delete(reason);
            this.tempChannels.delete(channelId);
            this.channelOwners.delete(channelId);
            this.logger.info(`Deleted temp voice channel: ${channelId} (${reason})`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to delete temp channel:', error);
            return false;
        }
    }
    async sendChannelControlPanel(channel, owner) {
        try {
            const controlEmbed = embed_1.EmbedManager.createInfoEmbed('Voice Channel Controls', `You are now the owner of **${channel.name}**. Use the buttons below to manage your channel.`);
            const controlRows = [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 2,
                            label: 'Rename',
                            customId: `voice_rename_${channel.id}`,
                            emoji: { name: '✏️' }
                        },
                        {
                            type: 2,
                            style: 2,
                            label: 'Lock',
                            customId: `voice_lock_${channel.id}`,
                            emoji: { name: '🔒' }
                        },
                        {
                            type: 2,
                            style: 2,
                            label: 'Hide',
                            customId: `voice_hide_${channel.id}`,
                            emoji: { name: '👁️' }
                        },
                        {
                            type: 2,
                            style: 2,
                            label: 'Limit',
                            customId: `voice_limit_${channel.id}`,
                            emoji: { name: '👥' }
                        }
                    ]
                },
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 1,
                            label: 'Invite User',
                            customId: `voice_invite_${channel.id}`,
                            emoji: { name: '➕' }
                        },
                        {
                            type: 2,
                            style: 4,
                            label: 'Delete Channel',
                            customId: `voice_delete_${channel.id}`,
                            emoji: { name: '🗑️' }
                        }
                    ]
                }
            ];
            await helpers_1.HelperUtils.safeDMSend(owner.user, {
                embeds: [controlEmbed],
                components: controlRows
            });
        }
        catch (error) {
            this.logger.error('Failed to send channel control panel:', error);
        }
    }
    async logVoiceActivity(oldState, newState) {
        try {
            if (!this.bot.channelManager || !newState.member)
                return;
            const member = newState.member;
            let logMessage = '';
            let logFields = [];
            if (!oldState.channel && newState.channel) {
                logMessage = `${helpers_1.HelperUtils.formatUserTag(member)} joined voice channel`;
                logFields.push({ name: 'Channel', value: newState.channel.name, inline: true });
            }
            else if (oldState.channel && !newState.channel) {
                logMessage = `${helpers_1.HelperUtils.formatUserTag(member)} left voice channel`;
                logFields.push({ name: 'Channel', value: oldState.channel.name, inline: true });
            }
            else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
                logMessage = `${helpers_1.HelperUtils.formatUserTag(member)} moved between voice channels`;
                logFields.push({ name: 'From', value: oldState.channel.name, inline: true }, { name: 'To', value: newState.channel.name, inline: true });
            }
            else if (oldState.mute !== newState.mute) {
                logMessage = `${helpers_1.HelperUtils.formatUserTag(member)} ${newState.mute ? 'muted' : 'unmuted'} microphone`;
                if (newState.channel) {
                    logFields.push({ name: 'Channel', value: newState.channel.name, inline: true });
                }
            }
            else if (oldState.deaf !== newState.deaf) {
                logMessage = `${helpers_1.HelperUtils.formatUserTag(member)} ${newState.deaf ? 'deafened' : 'undeafened'} audio`;
                if (newState.channel) {
                    logFields.push({ name: 'Channel', value: newState.channel.name, inline: true });
                }
            }
            if (logMessage) {
                const embed = embed_1.EmbedManager.createLogEmbed('Voice Activity', logMessage, logFields);
                await this.bot.channelManager.sendLog('voiceLogs', embed);
            }
            if (newState.channel && this.isTempChannel(newState.channelId)) {
                const tempData = this.tempChannels.get(newState.channelId);
                if (tempData) {
                    tempData.lastActivity = new Date();
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to log voice activity:', error);
        }
    }
    startCleanupTimer() {
        setInterval(async () => {
            await this.cleanupInactiveChannels();
        }, 60000);
    }
    async cleanupInactiveChannels() {
        const now = new Date();
        const inactiveMinutes = config_1.config.settings.voiceInactiveMinutes;
        for (const [channelId, tempData] of this.tempChannels.entries()) {
            try {
                const channel = await this.bot.client.channels.fetch(channelId);
                if (!channel || channel.members.size === 0) {
                    const minutesSinceActivity = (now.getTime() - tempData.lastActivity.getTime()) / 60000;
                    if (minutesSinceActivity >= inactiveMinutes) {
                        await this.deleteTempChannel(channelId, 'Inactive for too long');
                    }
                }
                else {
                    tempData.lastActivity = now;
                }
            }
            catch (error) {
                this.tempChannels.delete(channelId);
                this.channelOwners.delete(channelId);
            }
        }
    }
    calculateChannelDuration(tempData) {
        const duration = Date.now() - tempData.createdAt.getTime();
        const minutes = Math.floor(duration / 60000);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        return `${minutes}m`;
    }
    isTempChannel(channelId) {
        return this.tempChannels.has(channelId);
    }
    canControlChannel(channelId, userId) {
        const ownerId = this.channelOwners.get(channelId);
        return ownerId === userId || permissions_1.PermissionManager.isStaff(this.bot.client.guilds.cache.first()?.members.cache.get(userId));
    }
    getTempChannelData(channelId) {
        return this.tempChannels.get(channelId) || null;
    }
    updateTempChannelData(channelId, updates) {
        const tempData = this.tempChannels.get(channelId);
        if (tempData) {
            Object.assign(tempData, updates);
        }
    }
    getActiveTempChannels() {
        return Array.from(this.tempChannels.values());
    }
}
exports.VoiceManager = VoiceManager;
//# sourceMappingURL=index.js.map