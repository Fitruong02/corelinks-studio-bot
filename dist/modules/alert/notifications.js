"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationManager = void 0;
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
const helpers_1 = require("@utils/helpers");
class NotificationManager {
    bot;
    logger;
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('NotificationManager');
    }
    async sendAlert(alertData) {
        try {
            if (alertData.target === 'dm') {
                await this.sendDMAlert(alertData);
            }
            else {
                await this.sendChannelAlert(alertData);
            }
        }
        catch (error) {
            this.logger.error('Failed to send alert notification:', error);
        }
    }
    async sendDMAlert(alertData) {
        try {
            const user = await this.bot.client.users.fetch(alertData.userId);
            if (!user) {
                this.logger.warn(`User not found for alert: ${alertData.userId}`);
                return;
            }
            const alertEmbed = embed_1.EmbedManager.createInfoEmbed('⏰ Alert Reminder', alertData.message);
            alertEmbed.addFields({
                name: 'Scheduled for',
                value: helpers_1.HelperUtils.formatTimestamp(alertData.triggerAt),
                inline: true
            });
            if (alertData.repeat) {
                alertEmbed.addFields({
                    name: 'Next Reminder',
                    value: 'Tomorrow at the same time',
                    inline: true
                });
            }
            await helpers_1.HelperUtils.safeDMSend(user, alertEmbed);
            this.logger.info(`Sent DM alert to ${user.tag}`);
        }
        catch (error) {
            this.logger.error('Failed to send DM alert:', error);
        }
    }
    async sendChannelAlert(alertData) {
        try {
            if (!this.bot.channelManager) {
                this.logger.warn('Channel manager not available for alert');
                return;
            }
            const user = await this.bot.client.users.fetch(alertData.userId);
            if (!user) {
                this.logger.warn(`User not found for alert: ${alertData.userId}`);
                return;
            }
            const alertEmbed = embed_1.EmbedManager.createInfoEmbed('⏰ Alert Reminder', alertData.message);
            alertEmbed.addFields({ name: 'For', value: `<@${alertData.userId}>`, inline: true }, { name: 'Scheduled for', value: helpers_1.HelperUtils.formatTimestamp(alertData.triggerAt), inline: true });
            if (alertData.repeat) {
                alertEmbed.addFields({
                    name: 'Repeats',
                    value: 'Daily',
                    inline: true
                });
            }
            await this.bot.channelManager.sendLog('alerts', alertEmbed);
            this.logger.info(`Sent channel alert for ${user.tag}`);
        }
        catch (error) {
            this.logger.error('Failed to send channel alert:', error);
        }
    }
}
exports.NotificationManager = NotificationManager;
//# sourceMappingURL=notifications.js.map