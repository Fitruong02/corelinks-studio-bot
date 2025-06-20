"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordLogger = void 0;
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
class DiscordLogger {
    bot;
    logger;
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('DiscordLogger');
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
    async logMessageEdit(oldMessage, newMessage) {
        try {
            if (!this.bot.channelManager)
                return;
            const editEmbed = embed_1.EmbedManager.createLogEmbed('✏️ Message Edited', `A message was edited in <#${newMessage.channelId}>`, [
                { name: 'Author', value: oldMessage.author.tag, inline: true },
                { name: 'Old Content', value: oldMessage.content || 'No content', inline: false },
                { name: 'New Content', value: newMessage.content || 'No content', inline: false },
                { name: 'Timestamp', value: `<t:${Math.floor(newMessage.createdAt.getTime() / 1000)}:F>`, inline: true }
            ]);
            await this.logToChannel('msgLogs', editEmbed);
        }
        catch (error) {
            this.logger.error('Failed to log message edit:', error);
        }
    }
    async logMessageDelete(message) {
        try {
            if (!this.bot.channelManager)
                return;
            const deleteEmbed = embed_1.EmbedManager.createLogEmbed('🗑️ Message Deleted', `A message was deleted in <#${message.channelId}>`, [
                { name: 'Author', value: message.author.tag, inline: true },
                { name: 'Content', value: message.content || 'No content', inline: false },
                { name: 'Timestamp', value: `<t:${Math.floor(message.createdAt.getTime() / 1000)}:F>`, inline: true }
            ]);
            await this.logToChannel('msgLogs', deleteEmbed);
        }
        catch (error) {
            this.logger.error('Failed to log message delete:', error);
        }
    }
    async logVoiceActivity(oldState, newState) {
        try {
            if (!this.bot.channelManager)
                return;
            const voiceEmbed = embed_1.EmbedManager.createLogEmbed('🔊 Voice Activity', `Voice state changed in <#${newState.channelId}>`, [
                { name: 'User', value: newState.member.user.tag, inline: true },
                { name: 'Old State', value: oldState.channelId ? `<#${oldState.channelId}>` : 'None', inline: true },
                { name: 'New State', value: newState.channelId ? `<#${newState.channelId}>` : 'None', inline: true },
                { name: 'Timestamp', value: `<t:${Math.floor(new Date().getTime() / 1000)}:F>`, inline: true }
            ]);
            await this.logToChannel('voiceLogs', voiceEmbed);
        }
        catch (error) {
            this.logger.error('Failed to log voice activity:', error);
        }
    }
}
exports.DiscordLogger = DiscordLogger;
//# sourceMappingURL=discord.js.map