// ===== src/utils/helpers.ts =====
import { User, GuildMember, TextChannel } from 'discord.js';
import { Logger } from '@utils/logger';

export class HelperUtils {
  private static logger = new Logger('HelperUtils');

  static async sleep(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  static formatUserTag(user: User | GuildMember): string {
    const userData = user instanceof GuildMember ? user.user : user;
    return `${userData.tag} (${userData.id})`;
  }

  static formatTimestamp(date: Date): string {
    return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
  }

  static formatRelativeTime(date: Date): string {
    return `<t:${Math.floor(date.getTime() / 1000)}:R>`;
  }

  static async safeChannelSend(channel: TextChannel, content: any): Promise<boolean> {
    try {
      await channel.send(content);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send message to channel ${channel.name}:`, error);
      return false;
    }
  }

  static async safeDMSend(user: User, content: any): Promise<boolean> {
    try {
      await user.send(content);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send DM to ${user.tag}:`, error);
      return false;
    }
  }

  static getWeekStart(date: Date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  static escapeMarkdown(text: string): string {
    return text.replace(/[\\`*_{}[\]()~>#+\-=|.!]/g, '\\$&');
  }

  static chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  static randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  static calculatePercentage(value: number, total: number): number {
    return total === 0 ? 0 : Math.round((value / total) * 100);
  }
}