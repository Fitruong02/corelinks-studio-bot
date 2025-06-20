"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingManager = void 0;
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
const helpers_1 = require("@utils/helpers");
const channels_1 = require("./channels");
const discord_1 = require("./discord");
class LoggingManager {
    bot;
    logger;
    channelLogger;
    discordLogger;
    inviteCache = new Map();
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('LoggingManager');
        this.channelLogger = new channels_1.ChannelLogger(bot);
        this.discordLogger = new discord_1.DiscordLogger(bot);
        this.cacheInvites();
    }
    async logJoinLeave(member, type, inviteUsed) {
        try {
            if (!this.bot.channelManager)
                return;
            if (type === 'join') {
                const joinEmbed = embed_1.EmbedManager.createLogEmbed('📥 Member Joined', `${helpers_1.HelperUtils.formatUserTag(member.user)} joined the server`, [
                    { name: 'Account Created', value: helpers_1.HelperUtils.formatTimestamp(member.user.createdAt), inline: true },
                    { name: 'Member Count', value: member.guild.memberCount.toString(), inline: true }
                ]);
                if (inviteUsed) {
                    joinEmbed.addFields({ name: 'Invite Code', value: inviteUsed.code, inline: true }, { name: 'Invited by', value: inviteUsed.inviter ? helpers_1.HelperUtils.formatUserTag(inviteUsed.inviter) : 'Unknown', inline: true }, { name: 'Invite Uses', value: `${inviteUsed.uses}/${inviteUsed.maxUses || '∞'}`, inline: true });
                }
                await this.bot.channelManager.sendLog('joinLeave', joinEmbed);
                if (inviteUsed) {
                    await this.logInviteUse(inviteUsed);
                }
            }
            else {
                const leaveEmbed = embed_1.EmbedManager.createLogEmbed('📤 Member Left', `${helpers_1.HelperUtils.formatUserTag(member.user)} left the server`, [
                    { name: 'Joined', value: member.joinedAt ? helpers_1.HelperUtils.formatTimestamp(member.joinedAt) : 'Unknown', inline: true },
                    { name: 'Member Count', value: member.guild.memberCount.toString(), inline: true },
                    { name: 'Roles', value: member.roles.cache.filter(role => role.name !== '@everyone').map(role => role.name).join(', ') || 'None', inline: false }
                ]);
                await this.bot.channelManager.sendLog('joinLeave', leaveEmbed);
            }
            this.logger.info(`Logged member ${type}: ${member.user.tag}`);
        }
        catch (error) {
            this.logger.error('Failed to log join/leave:', error);
        }
    }
    async logInviteUse(invite) {
        try {
            if (!this.bot.channelManager || !invite.inviter)
                return;
            const inviteEmbed = embed_1.EmbedManager.createLogEmbed('🔗 Invite Used', `Invite code \`${invite.code}\` was used`, [
                { name: 'Inviter', value: helpers_1.HelperUtils.formatUserTag(invite.inviter), inline: true },
                { name: 'Uses', value: `${invite.uses}/${invite.maxUses || '∞'}`, inline: true },
                { name: 'Channel', value: invite.channel?.name || 'Unknown', inline: true }
            ]);
            await this.bot.channelManager.sendLog('inviteLogs', inviteEmbed);
        }
        catch (error) {
            this.logger.error('Failed to log invite use:', error);
        }
    }
    async logMessageEdit(oldMessage, newMessage) {
        try {
            await this.discordLogger.logMessageEdit(oldMessage, newMessage);
        }
        catch (error) {
            this.logger.error('Failed to log message edit:', error);
        }
    }
    async logMessageDelete(message) {
        try {
            await this.discordLogger.logMessageDelete(message);
        }
        catch (error) {
            this.logger.error('Failed to log message delete:', error);
        }
    }
    async logVoiceActivity(oldState, newState) {
        try {
            await this.discordLogger.logVoiceActivity(oldState, newState);
        }
        catch (error) {
            this.logger.error('Failed to log voice activity:', error);
        }
    }
    async logCommandUsage(commandName, user, channelId, guildId) {
        try {
            if (!this.bot.channelManager)
                return;
            const commandEmbed = embed_1.EmbedManager.createLogEmbed('🤖 Command Used', `${helpers_1.HelperUtils.formatUserTag(user)} used command \`/${commandName}\``, [
                { name: 'Command', value: `\`/${commandName}\``, inline: true },
                { name: 'Channel', value: `<#${channelId}>`, inline: true },
                { name: 'Timestamp', value: helpers_1.HelperUtils.formatTimestamp(new Date()), inline: true }
            ]);
            await this.bot.channelManager.sendLog('cmdLogs', commandEmbed);
        }
        catch (error) {
            this.logger.error('Failed to log command usage:', error);
        }
    }
    async logPaymentActivity(type, details) {
        try {
            if (!this.bot.channelManager)
                return;
            const paymentEmbed = embed_1.EmbedManager.createLogEmbed('💰 Payment Activity', `Payment ${type}`, [
                { name: 'Type', value: type, inline: true },
                { name: 'Timestamp', value: helpers_1.HelperUtils.formatTimestamp(new Date()), inline: true }
            ]);
            if (details.invoiceId) {
                paymentEmbed.addFields({ name: 'Invoice ID', value: details.invoiceId, inline: true });
            }
            if (details.amount) {
                paymentEmbed.addFields({ name: 'Amount', value: `${details.amount.toLocaleString('vi-VN')} VND`, inline: true });
            }
            if (details.customerId) {
                paymentEmbed.addFields({ name: 'Customer', value: details.customerId, inline: true });
            }
            await this.bot.channelManager.sendLog('paymentLogs', paymentEmbed);
        }
        catch (error) {
            this.logger.error('Failed to log payment activity:', error);
        }
    }
    async cacheInvites() {
        try {
            const guild = this.bot.client.guilds.cache.first();
            if (!guild)
                return;
            const invites = await guild.invites.fetch();
            this.inviteCache.set(guild.id, Array.from(invites.values()));
            this.logger.info(`Cached ${invites.size} invites for guild ${guild.name}`);
        }
        catch (error) {
            this.logger.error('Failed to cache invites:', error);
        }
    }
    async detectInviteUsed(guildId) {
        try {
            const guild = this.bot.client.guilds.cache.get(guildId);
            if (!guild)
                return null;
            const newInvites = await guild.invites.fetch();
            const oldInvites = this.inviteCache.get(guildId) || [];
            for (const newInvite of newInvites.values()) {
                const oldInvite = oldInvites.find(inv => inv.code === newInvite.code);
                if (oldInvite && newInvite.uses && oldInvite.uses && newInvite.uses > oldInvite.uses) {
                    this.inviteCache.set(guildId, Array.from(newInvites.values()));
                    return newInvite;
                }
            }
            this.inviteCache.set(guildId, Array.from(newInvites.values()));
            return null;
        }
        catch (error) {
            this.logger.error('Failed to detect invite used:', error);
            return null;
        }
    }
    getChannelLogger() {
        return this.channelLogger;
    }
    getDiscordLogger() {
        return this.discordLogger;
    }
}
exports.LoggingManager = LoggingManager;
//# sourceMappingURL=index.js.map