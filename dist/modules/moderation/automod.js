"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoModerationManager = void 0;
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
const helpers_1 = require("@utils/helpers");
const Config_1 = require("@database/models/Config");
class AutoModerationManager {
    bot;
    logger;
    userViolations = new Map();
    settings;
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('AutoModerationManager');
        this.settings = this.getDefaultSettings();
        this.loadSettings();
        setInterval(() => this.resetViolationCounters(), 300000);
    }
    async processMessage(message) {
        try {
            if (!message.member)
                return;
            await this.checkInviteLinks(message);
            await this.checkSpam(message);
            await this.checkEveryoneMentions(message);
            await this.checkBlockedLinks(message);
        }
        catch (error) {
            this.logger.error('Error processing message for auto-mod:', error);
        }
    }
    async checkInviteLinks(message) {
        try {
            if (!this.settings.inviteLinks.enabled)
                return;
            const inviteRegex = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[a-zA-Z0-9]+/gi;
            const hasInvite = inviteRegex.test(message.content);
            if (hasInvite) {
                await this.handleViolation(message, 'invite_links', 'Posted invite link');
            }
        }
        catch (error) {
            this.logger.error('Error checking invite links:', error);
        }
    }
    async checkSpam(message) {
        try {
            if (!this.settings.spam.enabled)
                return;
            const userId = message.author.id;
            const violations = this.getUserViolations(userId);
            violations.recentMessages.push({
                content: message.content,
                timestamp: Date.now()
            });
            violations.recentMessages = violations.recentMessages.filter(msg => Date.now() - msg.timestamp < 60000);
            const similarMessages = violations.recentMessages.filter(msg => this.calculateSimilarity(msg.content, message.content) > 0.8);
            if (similarMessages.length >= 5) {
                await this.handleViolation(message, 'spam', 'Spam detected');
                violations.recentMessages = [];
            }
        }
        catch (error) {
            this.logger.error('Error checking spam:', error);
        }
    }
    async checkEveryoneMentions(message) {
        try {
            if (!this.settings.everyoneMentions.enabled)
                return;
            const hasEveryoneMention = message.content.includes('@everyone') || message.content.includes('@here');
            if (hasEveryoneMention && !message.member?.permissions.has('MentionEveryone')) {
                await this.handleViolation(message, 'everyone_mentions', 'Attempted @everyone mention');
            }
        }
        catch (error) {
            this.logger.error('Error checking everyone mentions:', error);
        }
    }
    async checkBlockedLinks(message) {
        try {
            if (!this.settings.blockedLinks || this.settings.blockedLinks.length === 0)
                return;
            const urlRegex = /(https?:\/\/[^\s]+)/gi;
            const urls = message.content.match(urlRegex) || [];
            for (const url of urls) {
                for (const pattern of this.settings.blockedLinks) {
                    const regex = new RegExp(pattern, 'i');
                    if (regex.test(url)) {
                        await this.handleViolation(message, 'blocked_links', `Posted blocked link: ${url}`);
                        return;
                    }
                }
            }
        }
        catch (error) {
            this.logger.error('Error checking blocked links:', error);
        }
    }
    async handleViolation(message, type, reason) {
        try {
            const setting = this.settings[type];
            if (!setting || !setting.enabled)
                return;
            const userId = message.author.id;
            const violations = this.getUserViolations(userId);
            violations.counts[type] = (violations.counts[type] || 0) + 1;
            violations.lastViolation = Date.now();
            await message.delete().catch(() => { });
            if (violations.counts[type] >= setting.threshold) {
                await this.executeAutoModAction(message.member, type, reason, setting);
                violations.counts[type] = 0;
            }
            await this.logAutoModAction(message, type, reason, violations.counts[type], setting.threshold);
        }
        catch (error) {
            this.logger.error('Error handling auto-mod violation:', error);
        }
    }
    async executeAutoModAction(member, type, reason, setting) {
        try {
            const { ModerationManager } = await Promise.resolve().then(() => __importStar(require('./index')));
            const modManager = new ModerationManager(this.bot);
            switch (setting.action) {
                case 'mute':
                    await modManager.muteUser(member, member.guild.members.me, setting.duration || 3600, `Auto-mod: ${reason}`);
                    break;
                case 'kick':
                    await modManager.kickUser(member, member.guild.members.me, `Auto-mod: ${reason}`);
                    break;
                case 'ban':
                    await modManager.banUser(member, member.guild.members.me, setting.duration || null, `Auto-mod: ${reason}`);
                    break;
                case 'timeout':
                    await modManager.timeoutUser(member, member.guild.members.me, setting.duration || 3600, `Auto-mod: ${reason}`);
                    break;
            }
            this.logger.info(`Auto-mod ${setting.action} applied to ${member.user.tag} for ${type}: ${reason}`);
        }
        catch (error) {
            this.logger.error('Error executing auto-mod action:', error);
        }
    }
    async logAutoModAction(message, type, reason, currentCount, threshold) {
        try {
            if (!this.bot.channelManager)
                return;
            const logEmbed = embed_1.EmbedManager.createLogEmbed('Auto-Moderation Action', `Auto-mod detected violation: ${type}`, [
                { name: 'User', value: helpers_1.HelperUtils.formatUserTag(message.author), inline: true },
                { name: 'Channel', value: `<#${message.channelId}>`, inline: true },
                { name: 'Violation Count', value: `${currentCount}/${threshold}`, inline: true },
                { name: 'Reason', value: reason, inline: false },
                { name: 'Message Content', value: message.content.substring(0, 500) || 'No content', inline: false }
            ]);
            await this.bot.channelManager.sendLog('automodLogs', logEmbed);
        }
        catch (error) {
            this.logger.error('Failed to log auto-mod action:', error);
        }
    }
    getUserViolations(userId) {
        if (!this.userViolations.has(userId)) {
            this.userViolations.set(userId, {
                counts: {},
                recentMessages: [],
                lastViolation: 0
            });
        }
        return this.userViolations.get(userId);
    }
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        if (longer.length === 0)
            return 1.0;
        return (longer.length - this.getEditDistance(longer, shorter)) / longer.length;
    }
    getEditDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                }
                else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
                }
            }
        }
        return matrix[str2.length][str1.length];
    }
    resetViolationCounters() {
        const now = Date.now();
        const resetTime = 900000;
        for (const [userId, violations] of this.userViolations.entries()) {
            if (now - violations.lastViolation > resetTime) {
                violations.counts = {};
                violations.recentMessages = [];
            }
        }
    }
    async loadSettings() {
        try {
            const savedSettings = await Config_1.ConfigModel.get('automod_settings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...savedSettings };
            }
        }
        catch (error) {
            this.logger.error('Failed to load auto-mod settings:', error);
        }
    }
    getDefaultSettings() {
        return {
            inviteLinks: {
                enabled: true,
                threshold: 3,
                action: 'mute',
                duration: 7200
            },
            spam: {
                enabled: true,
                threshold: 10,
                action: 'kick'
            },
            everyoneMentions: {
                enabled: true,
                threshold: 2,
                action: 'mute',
                duration: 7200
            },
            blockedLinks: []
        };
    }
    async updateSettings(newSettings) {
        try {
            this.settings = { ...this.settings, ...newSettings };
            await Config_1.ConfigModel.set('automod_settings', this.settings);
            this.logger.info('Auto-mod settings updated');
        }
        catch (error) {
            this.logger.error('Failed to update auto-mod settings:', error);
        }
    }
    getSettings() {
        return { ...this.settings };
    }
}
exports.AutoModerationManager = AutoModerationManager;
//# sourceMappingURL=automod.js.map