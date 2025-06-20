"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationManager = void 0;
const discord_js_1 = require("discord.js");
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
const permissions_1 = require("@utils/permissions");
const helpers_1 = require("@utils/helpers");
const automod_1 = require("./automod");
const actions_1 = require("./actions");
const massActions_1 = require("./massActions");
class ModerationManager {
    bot;
    logger;
    autoMod;
    actionManager;
    massActionManager;
    warnings = new Map();
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('ModerationManager');
        this.autoMod = new automod_1.AutoModerationManager(bot);
        this.actionManager = new actions_1.ModerationActionManager(bot);
        this.massActionManager = new massActions_1.MassModerationManager(bot);
    }
    async warnUser(target, moderator, reason) {
        try {
            if (!permissions_1.PermissionManager.canModerate(moderator, target)) {
                return false;
            }
            const warning = {
                id: Date.now().toString(),
                userId: target.id,
                moderatorId: moderator.id,
                reason,
                timestamp: new Date()
            };
            const userWarnings = this.warnings.get(target.id) || [];
            userWarnings.push(warning);
            this.warnings.set(target.id, userWarnings);
            const warningEmbed = embed_1.EmbedManager.createWarningEmbed('Warning Received', `You have received a warning in ${target.guild.name}`);
            warningEmbed.addFields({ name: 'Reason', value: reason, inline: false }, { name: 'Moderator', value: moderator.user.tag, inline: true }, { name: 'Date', value: helpers_1.HelperUtils.formatTimestamp(new Date()), inline: true }, { name: 'Total Warnings', value: userWarnings.length.toString(), inline: true });
            await helpers_1.HelperUtils.safeDMSend(target.user, warningEmbed);
            await this.logModerationAction('Warning', target.user, moderator.user, reason);
            this.logger.info(`${moderator.user.tag} warned ${target.user.tag}: ${reason}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to warn user:', error);
            return false;
        }
    }
    async timeoutUser(target, moderator, duration, reason) {
        try {
            if (!permissions_1.PermissionManager.canModerate(moderator, target)) {
                return false;
            }
            const timeoutUntil = new Date(Date.now() + duration * 1000);
            await target.timeout(duration * 1000, reason);
            const timeoutEmbed = embed_1.EmbedManager.createWarningEmbed('Timeout Applied', `You have been timed out in ${target.guild.name}`);
            timeoutEmbed.addFields({ name: 'Duration', value: this.formatDuration(duration), inline: true }, { name: 'Until', value: helpers_1.HelperUtils.formatTimestamp(timeoutUntil), inline: true }, { name: 'Reason', value: reason, inline: false });
            await helpers_1.HelperUtils.safeDMSend(target.user, timeoutEmbed);
            await this.logModerationAction('Timeout', target.user, moderator.user, `${this.formatDuration(duration)} - ${reason}`);
            this.logger.info(`${moderator.user.tag} timed out ${target.user.tag} for ${this.formatDuration(duration)}: ${reason}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to timeout user:', error);
            return false;
        }
    }
    async muteUser(target, moderator, duration, reason) {
        try {
            if (!permissions_1.PermissionManager.canModerate(moderator, target)) {
                return false;
            }
            await target.timeout(duration * 1000, reason);
            const muteEmbed = embed_1.EmbedManager.createWarningEmbed('Muted', `You have been muted in ${target.guild.name}`);
            muteEmbed.addFields({ name: 'Duration', value: this.formatDuration(duration), inline: true }, { name: 'Reason', value: reason, inline: false });
            await helpers_1.HelperUtils.safeDMSend(target.user, muteEmbed);
            await this.logModerationAction('Mute', target.user, moderator.user, `${this.formatDuration(duration)} - ${reason}`);
            this.logger.info(`${moderator.user.tag} muted ${target.user.tag} for ${this.formatDuration(duration)}: ${reason}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to mute user:', error);
            return false;
        }
    }
    async kickUser(target, moderator, reason) {
        try {
            if (!permissions_1.PermissionManager.canModerate(moderator, target)) {
                return false;
            }
            const kickEmbed = embed_1.EmbedManager.createErrorEmbed('Kicked from Server', `You have been kicked from ${target.guild.name}`);
            kickEmbed.addFields({ name: 'Reason', value: reason, inline: false }, { name: 'Moderator', value: moderator.user.tag, inline: true });
            await helpers_1.HelperUtils.safeDMSend(target.user, kickEmbed);
            await target.kick(reason);
            await this.logModerationAction('Kick', target.user, moderator.user, reason);
            this.logger.info(`${moderator.user.tag} kicked ${target.user.tag}: ${reason}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to kick user:', error);
            return false;
        }
    }
    async banUser(target, moderator, duration, reason) {
        try {
            const targetUser = target instanceof discord_js_1.GuildMember ? target.user : target;
            const targetMember = target instanceof discord_js_1.GuildMember ? target : null;
            if (targetMember && !permissions_1.PermissionManager.canModerate(moderator, targetMember)) {
                return false;
            }
            const banEmbed = embed_1.EmbedManager.createErrorEmbed('Banned from Server', `You have been banned from ${moderator.guild.name}`);
            banEmbed.addFields({ name: 'Duration', value: duration ? this.formatDuration(duration) : 'Permanent', inline: true }, { name: 'Reason', value: reason, inline: false }, { name: 'Moderator', value: moderator.user.tag, inline: true });
            await helpers_1.HelperUtils.safeDMSend(targetUser, banEmbed);
            await moderator.guild.members.ban(targetUser, { reason, deleteMessageDays: 1 });
            if (duration) {
                setTimeout(async () => {
                    try {
                        await moderator.guild.members.unban(targetUser, 'Temporary ban expired');
                        await this.logModerationAction('Unban', targetUser, this.bot.client.user, 'Temporary ban expired');
                    }
                    catch (error) {
                        this.logger.error('Failed to auto-unban user:', error);
                    }
                }, duration * 1000);
            }
            const durationText = duration ? this.formatDuration(duration) : 'Permanent';
            await this.logModerationAction('Ban', targetUser, moderator.user, `${durationText} - ${reason}`);
            this.logger.info(`${moderator.user.tag} banned ${targetUser.tag} (${durationText}): ${reason}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to ban user:', error);
            return false;
        }
    }
    async roleLockUser(target, moderator, duration, reason) {
        try {
            if (!permissions_1.PermissionManager.canModerate(moderator, target)) {
                return false;
            }
            const currentRoles = target.roles.cache
                .filter(role => role.name !== '@everyone')
                .map(role => role.id);
            await target.roles.set([], reason);
            const roleLockEmbed = embed_1.EmbedManager.createWarningEmbed('Role Lock Applied', `Your roles have been temporarily removed in ${target.guild.name}`);
            roleLockEmbed.addFields({ name: 'Duration', value: this.formatDuration(duration), inline: true }, { name: 'Reason', value: reason, inline: false });
            await helpers_1.HelperUtils.safeDMSend(target.user, roleLockEmbed);
            setTimeout(async () => {
                try {
                    if (target.guild.members.cache.has(target.id)) {
                        await target.roles.add(currentRoles, 'Role lock expired');
                        await this.logModerationAction('Role Unlock', target.user, this.bot.client.user, 'Role lock expired');
                    }
                }
                catch (error) {
                    this.logger.error('Failed to restore roles:', error);
                }
            }, duration * 1000);
            await this.logModerationAction('Role Lock', target.user, moderator.user, `${this.formatDuration(duration)} - ${reason}`);
            this.logger.info(`${moderator.user.tag} role-locked ${target.user.tag} for ${this.formatDuration(duration)}: ${reason}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to role lock user:', error);
            return false;
        }
    }
    async clearMessages(channel, amount, moderator, filter) {
        try {
            if (amount > 100)
                amount = 100;
            const messages = await channel.messages.fetch({ limit: amount });
            const filteredMessages = filter ? messages.filter(filter) : messages;
            const deletedMessages = await channel.bulkDelete(filteredMessages, true);
            await this.logModerationAction('Clear Messages', null, moderator.user, `Cleared ${deletedMessages.size} messages in ${channel.name}`);
            this.logger.info(`${moderator.user.tag} cleared ${deletedMessages.size} messages in ${channel.name}`);
            return deletedMessages.size;
        }
        catch (error) {
            this.logger.error('Failed to clear messages:', error);
            return 0;
        }
    }
    async getUserWarnings(userId) {
        return this.warnings.get(userId) || [];
    }
    async removeWarning(userId, warningId, moderator) {
        try {
            const userWarnings = this.warnings.get(userId) || [];
            const warningIndex = userWarnings.findIndex(w => w.id === warningId);
            if (warningIndex === -1)
                return false;
            userWarnings.splice(warningIndex, 1);
            this.warnings.set(userId, userWarnings);
            await this.logModerationAction('Warning Removed', null, moderator.user, `Removed warning ${warningId} from <@${userId}>`);
            this.logger.info(`${moderator.user.tag} removed warning ${warningId} from user ${userId}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to remove warning:', error);
            return false;
        }
    }
    async logModerationAction(action, target, moderator, details) {
        try {
            if (!this.bot.channelManager)
                return;
            const logEmbed = embed_1.EmbedManager.createModerationEmbed(action, target ? helpers_1.HelperUtils.formatUserTag(target) : 'N/A', details, helpers_1.HelperUtils.formatUserTag(moderator));
            await this.bot.channelManager.sendLog('modLogs', logEmbed);
        }
        catch (error) {
            this.logger.error('Failed to log moderation action:', error);
        }
    }
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        const parts = [];
        if (hours > 0)
            parts.push(`${hours}h`);
        if (minutes > 0)
            parts.push(`${minutes}m`);
        if (remainingSeconds > 0)
            parts.push(`${remainingSeconds}s`);
        return parts.join(' ') || '0s';
    }
    getAutoMod() {
        return this.autoMod;
    }
    getActionManager() {
        return this.actionManager;
    }
    getMassActionManager() {
        return this.massActionManager;
    }
}
exports.ModerationManager = ModerationManager;
//# sourceMappingURL=index.js.map