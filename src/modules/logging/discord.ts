// ===== src/modules/logging/channels.ts =====
import { CorelinksBot } from '../../bot';
import { TextChannel } from 'discord.js';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';

export class DiscordLogger {
  private bot: CorelinksBot;
  private logger: Logger;

  constructor(bot: CorelinksBot) {
    this.bot = bot;
    this.logger = new Logger('DiscordLogger');
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

  async logMessageEdit(oldMessage: any, newMessage: any): Promise<void> {
    try {
      if (!this.bot.channelManager) return;

      const editEmbed = EmbedManager.createLogEmbed(
        '✏️ Message Edited',
        `A message was edited in <#${newMessage.channelId}>`,
        [
          { name: 'Author', value: oldMessage.author.tag, inline: true },
          { name: 'Old Content', value: oldMessage.content || 'No content', inline: false },
          { name: 'New Content', value: newMessage.content || 'No content', inline: false },
          { name: 'Timestamp', value: `<t:${Math.floor(newMessage.createdAt.getTime() / 1000)}:F>`, inline: true }
        ]
      );

      await this.logToChannel('msgLogs', editEmbed);

    } catch (error) {
      this.logger.error('Failed to log message edit:', error);
    }
  }

  async logMessageDelete(message: any): Promise<void> {
    try {
      if (!this.bot.channelManager) return;

      const deleteEmbed = EmbedManager.createLogEmbed(
        '🗑️ Message Deleted',
        `A message was deleted in <#${message.channelId}>`,
        [
          { name: 'Author', value: message.author.tag, inline: true },
          { name: 'Content', value: message.content || 'No content', inline: false },
          { name: 'Timestamp', value: `<t:${Math.floor(message.createdAt.getTime() / 1000)}:F>`, inline: true }
        ]
      );

      await this.logToChannel('msgLogs', deleteEmbed);

    } catch (error) {
      this.logger.error('Failed to log message delete:', error);
    }
  }

  async logVoiceActivity(oldState: any, newState: any): Promise<void> {
    try {
      if (!this.bot.channelManager) return;

      const voiceEmbed = EmbedManager.createLogEmbed(
        '🔊 Voice Activity',
        `Voice state changed in <#${newState.channelId}>`,
        [
          { name: 'User', value: newState.member.user.tag, inline: true },
          { name: 'Old State', value: oldState.channelId ? `<#${oldState.channelId}>` : 'None', inline: true },
          { name: 'New State', value: newState.channelId ? `<#${newState.channelId}>` : 'None', inline: true },
          { name: 'Timestamp', value: `<t:${Math.floor(new Date().getTime() / 1000)}:F>`, inline: true }
        ]
      );

      await this.logToChannel('voiceLogs', voiceEmbed);

    } catch (error) {
      this.logger.error('Failed to log voice activity:', error);
    }
  }
}