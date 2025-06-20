"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TempChannelManager = void 0;
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
const helpers_1 = require("@utils/helpers");
class TempChannelManager {
    bot;
    logger;
    voiceManager;
    constructor(bot, voiceManager) {
        this.bot = bot;
        this.logger = new logger_1.Logger('TempChannelManager');
        this.voiceManager = voiceManager;
    }
    async createTempChannel(member) {
        try {
            const existingChannel = await this.findUserTempChannel(member.id);
            if (existingChannel) {
                await member.voice.setChannel(existingChannel);
                const infoEmbed = embed_1.EmbedManager.createInfoEmbed('Existing Channel', `You already have a temporary channel: **${existingChannel.name}**`);
                await helpers_1.HelperUtils.safeDMSend(member.user, infoEmbed);
                return;
            }
            const tempChannel = await this.voiceManager.createTempChannel(member);
            if (!tempChannel) {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Creation Failed', 'Failed to create temporary voice channel. Please try again later.');
                await helpers_1.HelperUtils.safeDMSend(member.user, errorEmbed);
                return;
            }
            this.logger.info(`Created temp channel for ${member.user.tag}: ${tempChannel.name}`);
        }
        catch (error) {
            this.logger.error('Failed to create temp channel:', error);
        }
    }
    async handleUserJoin(voiceState) {
        try {
            if (!voiceState.member || !voiceState.channel)
                return;
            const tempData = this.voiceManager.getTempChannelData(voiceState.channelId);
            if (!tempData)
                return;
            if (this.bot.channelManager) {
                const logEmbed = embed_1.EmbedManager.createLogEmbed('Temp Channel Join', `${helpers_1.HelperUtils.formatUserTag(voiceState.member)} joined temporary voice channel`, [
                    { name: 'Channel', value: voiceState.channel.name, inline: true },
                    { name: 'Owner', value: `<@${tempData.ownerId}>`, inline: true },
                    { name: 'Members', value: voiceState.channel.members.size.toString(), inline: true }
                ]);
                await this.bot.channelManager.sendLog('voiceLogs', logEmbed);
            }
            this.voiceManager.updateTempChannelData(voiceState.channelId, {
                lastActivity: new Date()
            });
        }
        catch (error) {
            this.logger.error('Failed to handle user join:', error);
        }
    }
    async handleUserLeave(voiceState) {
        try {
            if (!voiceState.member || !voiceState.channel)
                return;
            const tempData = this.voiceManager.getTempChannelData(voiceState.channelId);
            if (!tempData)
                return;
            if (this.bot.channelManager) {
                const logEmbed = embed_1.EmbedManager.createLogEmbed('Temp Channel Leave', `${helpers_1.HelperUtils.formatUserTag(voiceState.member)} left temporary voice channel`, [
                    { name: 'Channel', value: voiceState.channel.name, inline: true },
                    { name: 'Owner', value: `<@${tempData.ownerId}>`, inline: true },
                    { name: 'Remaining Members', value: (voiceState.channel.members.size - 1).toString(), inline: true }
                ]);
                await this.bot.channelManager.sendLog('voiceLogs', logEmbed);
            }
            if (voiceState.channel.members.size <= 1 || voiceState.member.id === tempData.ownerId) {
                setTimeout(async () => {
                    const channel = await this.bot.client.channels.fetch(voiceState.channelId);
                    if (channel && channel.members.size === 0) {
                        await this.voiceManager.deleteTempChannel(voiceState.channelId, 'Channel empty');
                    }
                }, 10000);
            }
        }
        catch (error) {
            this.logger.error('Failed to handle user leave:', error);
        }
    }
    async transferOwnership(channelId, currentOwnerId, newOwnerId) {
        try {
            const tempData = this.voiceManager.getTempChannelData(channelId);
            if (!tempData || tempData.ownerId !== currentOwnerId) {
                return false;
            }
            const channel = await this.bot.client.channels.fetch(channelId);
            if (!channel)
                return false;
            const newOwner = await this.bot.client.users.fetch(newOwnerId);
            if (!newOwner)
                return false;
            this.voiceManager.updateTempChannelData(channelId, { ownerId: newOwnerId });
            await channel.permissionOverwrites.delete(currentOwnerId);
            await channel.permissionOverwrites.create(newOwnerId, {
                ViewChannel: true,
                Connect: true,
                Speak: true,
                ManageChannels: true,
                MoveMembers: true
            });
            if (this.bot.channelManager) {
                const logEmbed = embed_1.EmbedManager.createLogEmbed('Temp Channel Ownership Transfer', `Ownership of ${channel.name} transferred`, [
                    { name: 'Previous Owner', value: `<@${currentOwnerId}>`, inline: true },
                    { name: 'New Owner', value: `<@${newOwnerId}>`, inline: true },
                    { name: 'Channel', value: channel.name, inline: true }
                ]);
                await this.bot.channelManager.sendLog('voiceLogs', logEmbed);
            }
            this.logger.info(`Transferred ownership of ${channelId} from ${currentOwnerId} to ${newOwnerId}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to transfer ownership:', error);
            return false;
        }
    }
    async findUserTempChannel(userId) {
        try {
            const tempChannels = this.voiceManager.getActiveTempChannels();
            const userChannel = tempChannels.find(data => data.ownerId === userId);
            if (userChannel) {
                return await this.bot.client.channels.fetch(userChannel.channelId);
            }
            return null;
        }
        catch (error) {
            this.logger.error('Failed to find user temp channel:', error);
            return null;
        }
    }
    async cleanupUserChannels(userId) {
        try {
            const userChannels = this.voiceManager.getActiveTempChannels()
                .filter(data => data.ownerId === userId);
            for (const channelData of userChannels) {
                await this.voiceManager.deleteTempChannel(channelData.channelId, 'User cleanup');
            }
            this.logger.info(`Cleaned up ${userChannels.length} channels for user ${userId}`);
        }
        catch (error) {
            this.logger.error('Failed to cleanup user channels:', error);
        }
    }
}
exports.TempChannelManager = TempChannelManager;
//# sourceMappingURL=tempChannels.js.map