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
exports.ModerationActionManager = void 0;
const discord_js_1 = require("discord.js");
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
const permissions_1 = require("@utils/permissions");
class ModerationActionManager {
    bot;
    logger;
    actionHistory = new Map();
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('ModerationActionManager');
    }
    async executeAction(action, target, moderator, options) {
        try {
            const targetUser = target instanceof discord_js_1.GuildMember ? target.user : target;
            const targetMember = target instanceof discord_js_1.GuildMember ? target : null;
            if (targetMember && !permissions_1.PermissionManager.canModerate(moderator, targetMember)) {
                this.logger.warn(`${moderator.user.tag} attempted to moderate ${targetUser.tag} without permission`);
                return false;
            }
            let success = false;
            switch (action) {
                case 'warn':
                    success = targetMember ? await this.warnUser(targetMember, moderator, options.reason || '') : false;
                    break;
                case 'timeout':
                    success = targetMember ? await this.timeoutUser(targetMember, moderator, options.duration || 3600, options.reason || '') : false;
                    break;
                case 'mute':
                    success = targetMember ? await this.muteUser(targetMember, moderator, options.duration || 3600, options.reason || '') : false;
                    break;
                case 'kick':
                    success = targetMember ? await this.kickUser(targetMember, moderator, options.reason || '') : false;
                    break;
                case 'ban':
                    success = await this.banUser(target, moderator, options.duration ?? null, options.reason || '');
                    break;
                case 'unban':
                    success = await this.unbanUser(targetUser, moderator, options.reason || '');
                    break;
                default:
                    this.logger.warn(`Unknown moderation action: ${action}`);
                    return false;
            }
            if (success) {
                this.recordAction(targetUser.id, {
                    type: action,
                    moderatorId: moderator.id,
                    reason: options.reason || '',
                    duration: options.duration,
                    timestamp: new Date()
                });
            }
            return success;
        }
        catch (error) {
            this.logger.error('Failed to execute moderation action:', error);
            return false;
        }
    }
    async warnUser(target, moderator, reason) {
        try {
            const { ModerationManager } = await Promise.resolve().then(() => __importStar(require('./index')));
            const modManager = new ModerationManager(this.bot);
            return await modManager.warnUser(target, moderator, reason);
        }
        catch (error) {
            this.logger.error('Failed to warn user:', error);
            return false;
        }
    }
    async timeoutUser(target, moderator, duration, reason) {
        try {
            const { ModerationManager } = await Promise.resolve().then(() => __importStar(require('./index')));
            const modManager = new ModerationManager(this.bot);
            return await modManager.timeoutUser(target, moderator, duration, reason);
        }
        catch (error) {
            this.logger.error('Failed to timeout user:', error);
            return false;
        }
    }
    async muteUser(target, moderator, duration, reason) {
        try {
            const { ModerationManager } = await Promise.resolve().then(() => __importStar(require('./index')));
            const modManager = new ModerationManager(this.bot);
            return await modManager.muteUser(target, moderator, duration, reason);
        }
        catch (error) {
            this.logger.error('Failed to mute user:', error);
            return false;
        }
    }
    async kickUser(target, moderator, reason) {
        try {
            const { ModerationManager } = await Promise.resolve().then(() => __importStar(require('./index')));
            const modManager = new ModerationManager(this.bot);
            return await modManager.kickUser(target, moderator, reason);
        }
        catch (error) {
            this.logger.error('Failed to kick user:', error);
            return false;
        }
    }
    async banUser(target, moderator, duration, reason) {
        try {
            const { ModerationManager } = await Promise.resolve().then(() => __importStar(require('./index')));
            const modManager = new ModerationManager(this.bot);
            return await modManager.banUser(target, moderator, duration, reason);
        }
        catch (error) {
            this.logger.error('Failed to ban user:', error);
            return false;
        }
    }
    async unbanUser(target, moderator, reason) {
        try {
            await moderator.guild.members.unban(target, reason);
            if (this.bot.channelManager) {
                const logEmbed = embed_1.EmbedManager.createModerationEmbed('Unban', target.tag, reason, moderator.user.tag);
                await this.bot.channelManager.sendLog('modLogs', logEmbed);
            }
            this.logger.info(`${moderator.user.tag} unbanned ${target.tag}: ${reason}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to unban user:', error);
            return false;
        }
    }
    async getUserHistory(userId, limit = 10) {
        const history = this.actionHistory.get(userId) || [];
        return history.slice(-limit).reverse();
    }
    async getModeratorStats(moderatorId, days = 30) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        let totalActions = 0;
        const actionCounts = {
            warn: 0,
            timeout: 0,
            mute: 0,
            kick: 0,
            ban: 0,
            unban: 0
        };
        for (const actions of this.actionHistory.values()) {
            for (const action of actions) {
                if (action.moderatorId === moderatorId && action.timestamp >= since) {
                    totalActions++;
                    actionCounts[action.type]++;
                }
            }
        }
        return {
            totalActions,
            actionCounts,
            period: days
        };
    }
    recordAction(userId, action) {
        const history = this.actionHistory.get(userId) || [];
        history.push(action);
        if (history.length > 50) {
            history.shift();
        }
        this.actionHistory.set(userId, history);
    }
    getActionHistory() {
        return new Map(this.actionHistory);
    }
}
exports.ModerationActionManager = ModerationActionManager;
//# sourceMappingURL=actions.js.map