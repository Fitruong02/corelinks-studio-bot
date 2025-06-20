// ===== src/modules/logging/channels.ts =====
import { CorelinksBot } from '../../bot';
import { TextChannel } from 'discord.js';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';

export class ChannelLogger {
  private bot: CorelinksBot;
  private logger: Logger;

  constructor(bot: CorelinksBot) {
    this.bot = bot;
    this.logger = new Logger('ChannelLogger');
  }

  async logToChannel(channelName: string, embed: any): Promise<boolean> {
    try {
      if (!this.bot.channelManager) {
        this.logger.warn('Channel manager not available');
        return false;
      }

      await this.bot.channelManager.sendLog(channelName as any, embed);
      return true;

    } catch (error) {
      this.logger.error(`Failed to log to channel ${channelName}:`, error);
      return false;
    }
  }

  async createLogMessage(title: string, description: string, fields: any[] = []): Promise<any> {
    return EmbedManager.createLogEmbed(title, description, fields);
  }

  async logCustomEvent(channelName: string, eventName: string, details: Record<string, any>): Promise<void> {
    try {
      const embed = this.createLogMessage(
        eventName,
        `Custom event: ${eventName}`,
        Object.entries(details).map(([key, value]) => ({
          name: key,
          value: String(value),
          inline: true
        }))
      );

      await this.logToChannel(channelName, embed);

    } catch (error) {
      this.logger.error('Failed to log custom event:', error);
    }
  }

  async logError(error: Error, context: string): Promise<void> {
    try {
      const errorEmbed = EmbedManager.createErrorEmbed(
        'Bot Error',
        `An error occurred in ${context}`
      );

      errorEmbed.addFields(
        { name: 'Error Message', value: error.message.substring(0, 1000), inline: false },
        { name: 'Stack Trace', value: error.stack?.substring(0, 1000) || 'No stack trace', inline: false }
      );

      // Try to log to mod logs, fallback to console if not available
      const success = await this.logToChannel('modLogs', errorEmbed);
      if (!success) {
        this.logger.error(`Bot error in ${context}:`, error);
      }

    } catch (logError) {
      this.logger.error('Failed to log error:', logError);
    }
  }
}
