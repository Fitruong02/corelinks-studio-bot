// ===== src/modules/alert/notifications.ts =====
import { CorelinksBot } from '../../bot';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';
import { HelperUtils } from '@utils/helpers';

export class NotificationManager {
  private bot: CorelinksBot;
  private logger: Logger;

  constructor(bot: CorelinksBot) {
    this.bot = bot;
    this.logger = new Logger('NotificationManager');
  }

  async sendAlert(alertData: any): Promise<void> {
    try {
      if (alertData.target === 'dm') {
        await this.sendDMAlert(alertData);
      } else {
        await this.sendChannelAlert(alertData);
      }
    } catch (error) {
      this.logger.error('Failed to send alert notification:', error);
    }
  }

  private async sendDMAlert(alertData: any): Promise<void> {
    try {
      const user = await this.bot.client.users.fetch(alertData.userId);
      if (!user) {
        this.logger.warn(`User not found for alert: ${alertData.userId}`);
        return;
      }

      const alertEmbed = EmbedManager.createInfoEmbed(
        '⏰ Alert Reminder',
        alertData.message
      );

      alertEmbed.addFields({
        name: 'Scheduled for',
        value: HelperUtils.formatTimestamp(alertData.triggerAt),
        inline: true
      });

      if (alertData.repeat) {
        alertEmbed.addFields({
          name: 'Next Reminder',
          value: 'Tomorrow at the same time',
          inline: true
        });
      }

      await HelperUtils.safeDMSend(user, alertEmbed);
      this.logger.info(`Sent DM alert to ${user.tag}`);

    } catch (error) {
      this.logger.error('Failed to send DM alert:', error);
    }
  }

  private async sendChannelAlert(alertData: any): Promise<void> {
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

      const alertEmbed = EmbedManager.createInfoEmbed(
        '⏰ Alert Reminder',
        alertData.message
      );

      alertEmbed.addFields(
        { name: 'For', value: `<@${alertData.userId}>`, inline: true },
        { name: 'Scheduled for', value: HelperUtils.formatTimestamp(alertData.triggerAt), inline: true }
      );

      if (alertData.repeat) {
        alertEmbed.addFields({
          name: 'Repeats',
          value: 'Daily',
          inline: true
        });
      }

      await this.bot.channelManager.sendLog('alerts', alertEmbed);
      this.logger.info(`Sent channel alert for ${user.tag}`);

    } catch (error) {
      this.logger.error('Failed to send channel alert:', error);
    }
  }
}