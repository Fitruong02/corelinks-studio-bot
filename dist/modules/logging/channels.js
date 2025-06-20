"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelLogger = void 0;
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
class ChannelLogger {
    bot;
    logger;
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('ChannelLogger');
    }
    async logToChannel(channelName, embed) {
        try {
            if (!this.bot.channelManager) {
                this.logger.warn('Channel manager not available');
                return false;
            }
            await this.bot.channelManager.sendLog(channelName, embed);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to log to channel ${channelName}:`, error);
            return false;
        }
    }
    async createLogMessage(title, description, fields = []) {
        return embed_1.EmbedManager.createLogEmbed(title, description, fields);
    }
    async logCustomEvent(channelName, eventName, details) {
        try {
            const embed = this.createLogMessage(eventName, `Custom event: ${eventName}`, Object.entries(details).map(([key, value]) => ({
                name: key,
                value: String(value),
                inline: true
            })));
            await this.logToChannel(channelName, embed);
        }
        catch (error) {
            this.logger.error('Failed to log custom event:', error);
        }
    }
    async logError(error, context) {
        try {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Bot Error', `An error occurred in ${context}`);
            errorEmbed.addFields({ name: 'Error Message', value: error.message.substring(0, 1000), inline: false }, { name: 'Stack Trace', value: error.stack?.substring(0, 1000) || 'No stack trace', inline: false });
            const success = await this.logToChannel('modLogs', errorEmbed);
            if (!success) {
                this.logger.error(`Bot error in ${context}:`, error);
            }
        }
        catch (logError) {
            this.logger.error('Failed to log error:', logError);
        }
    }
}
exports.ChannelLogger = ChannelLogger;
//# sourceMappingURL=channels.js.map