// ===== src/modules/moderation/automod.ts =====
import { CorelinksBot } from '../../bot';
import { Message, GuildMember } from 'discord.js';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';
import { HelperUtils } from '@utils/helpers';
import { ConfigModel } from '@database/models/Config';

export class AutoModerationManager {
  private bot: CorelinksBot;
  private logger: Logger;
  private userViolations: Map<string, UserViolations> = new Map();
  private settings: AutoModSettings;

  constructor(bot: CorelinksBot) {
    this.bot = bot;
    this.logger = new Logger('AutoModerationManager');
    this.settings = this.getDefaultSettings();
    this.loadSettings();

    // Reset violation counters periodically
    setInterval(() => this.resetViolationCounters(), 300000); // Every 5 minutes
  }

  async processMessage(message: Message): Promise<void> {
    try {
      if (!message.member) return;

      // Check various auto-mod rules
      await this.checkInviteLinks(message);
      await this.checkSpam(message);
      await this.checkEveryoneMentions(message);
      await this.checkBlockedLinks(message);

    } catch (error) {
      this.logger.error('Error processing message for auto-mod:', error);
    }
  }

  private async checkInviteLinks(message: Message): Promise<void> {
    try {
      if (!this.settings.inviteLinks.enabled) return;

      const inviteRegex = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[a-zA-Z0-9]+/gi;
      const hasInvite = inviteRegex.test(message.content);

      if (hasInvite) {
        await this.handleViolation(message, 'invite_links', 'Posted invite link');
      }
    } catch (error) {
      this.logger.error('Error checking invite links:', error);
    }
  }

  private async checkSpam(message: Message): Promise<void> {
    try {
      if (!this.settings.spam.enabled) return;

      const userId = message.author.id;
      const violations = this.getUserViolations(userId);

      // Check for repeated messages
      violations.recentMessages.push({
        content: message.content,
        timestamp: Date.now()
      });

      // Keep only messages from last minute
      violations.recentMessages = violations.recentMessages.filter(
        msg => Date.now() - msg.timestamp < 60000
      );

      // Check for spam (5+ similar messages in 1 minute)
      const similarMessages = violations.recentMessages.filter(
        msg => this.calculateSimilarity(msg.content, message.content) > 0.8
      );

      if (similarMessages.length >= 5) {
        await this.handleViolation(message, 'spam', 'Spam detected');
        violations.recentMessages = []; // Clear after action
      }

    } catch (error) {
      this.logger.error('Error checking spam:', error);
    }
  }

  private async checkEveryoneMentions(message: Message): Promise<void> {
    try {
      if (!this.settings.everyoneMentions.enabled) return;

      const hasEveryoneMention = message.content.includes('@everyone') || message.content.includes('@here');

      if (hasEveryoneMention && !message.member?.permissions.has('MentionEveryone')) {
        await this.handleViolation(message, 'everyone_mentions', 'Attempted @everyone mention');
      }
    } catch (error) {
      this.logger.error('Error checking everyone mentions:', error);
    }
  }

  private async checkBlockedLinks(message: Message): Promise<void> {
    try {
      if (!this.settings.blockedLinks || this.settings.blockedLinks.length === 0) return;

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
    } catch (error) {
      this.logger.error('Error checking blocked links:', error);
    }
  }

  private async handleViolation(message: Message, type: string, reason: string): Promise<void> {
    try {
      const setting = this.settings[type as keyof AutoModSettings] as AutoModRule;
      if (!setting || !setting.enabled) return;

      const userId = message.author.id;
      const violations = this.getUserViolations(userId);

      // Increment violation count
      violations.counts[type] = (violations.counts[type] || 0) + 1;
      violations.lastViolation = Date.now();

      // Delete the message
      await message.delete().catch(() => {});

      // Check if threshold is reached
      if (violations.counts[type] >= setting.threshold) {
        await this.executeAutoModAction(message.member!, type, reason, setting);
        violations.counts[type] = 0; // Reset after action
      }

      // Log the violation
      await this.logAutoModAction(message, type, reason, violations.counts[type], setting.threshold);

    } catch (error) {
      this.logger.error('Error handling auto-mod violation:', error);
    }
  }

  private async executeAutoModAction(member: GuildMember, type: string, reason: string, setting: AutoModRule): Promise<void> {
    try {
      const { ModerationManager } = await import('./index');
      const modManager = new ModerationManager(this.bot);

      switch (setting.action) {
        case 'mute':
          await modManager.muteUser(member, member.guild.members.me!, setting.duration || 3600, `Auto-mod: ${reason}`);
          break;
        case 'kick':
          await modManager.kickUser(member, member.guild.members.me!, `Auto-mod: ${reason}`);
          break;
        case 'ban':
          await modManager.banUser(member, member.guild.members.me!, setting.duration || null, `Auto-mod: ${reason}`);
          break;
        case 'timeout':
          await modManager.timeoutUser(member, member.guild.members.me!, setting.duration || 3600, `Auto-mod: ${reason}`);
          break;
      }

      this.logger.info(`Auto-mod ${setting.action} applied to ${member.user.tag} for ${type}: ${reason}`);

    } catch (error) {
      this.logger.error('Error executing auto-mod action:', error);
    }
  }

  private async logAutoModAction(message: Message, type: string, reason: string, currentCount: number, threshold: number): Promise<void> {
    try {
      if (!this.bot.channelManager) return;

      const logEmbed = EmbedManager.createLogEmbed(
        'Auto-Moderation Action',
        `Auto-mod detected violation: ${type}`,
        [
          { name: 'User', value: HelperUtils.formatUserTag(message.author), inline: true },
          { name: 'Channel', value: `<#${message.channelId}>`, inline: true },
          { name: 'Violation Count', value: `${currentCount}/${threshold}`, inline: true },
          { name: 'Reason', value: reason, inline: false },
          { name: 'Message Content', value: message.content.substring(0, 500) || 'No content', inline: false }
        ]
      );

      await this.bot.channelManager.sendLog('automodLogs', logEmbed);

    } catch (error) {
      this.logger.error('Failed to log auto-mod action:', error);
    }
  }

  private getUserViolations(userId: string): UserViolations {
    if (!this.userViolations.has(userId)) {
      this.userViolations.set(userId, {
        counts: {},
        recentMessages: [],
        lastViolation: 0
      });
    }
    return this.userViolations.get(userId)!;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    return (longer.length - this.getEditDistance(longer, shorter)) / longer.length;
  }

  private getEditDistance(str1: string, str2: string): number {
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
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private resetViolationCounters(): void {
    const now = Date.now();
    const resetTime = 900000; // 15 minutes

    for (const [userId, violations] of this.userViolations.entries()) {
      if (now - violations.lastViolation > resetTime) {
        violations.counts = {};
        violations.recentMessages = [];
      }
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const savedSettings = await ConfigModel.get('automod_settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...savedSettings };
      }
    } catch (error) {
      this.logger.error('Failed to load auto-mod settings:', error);
    }
  }

  private getDefaultSettings(): AutoModSettings {
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

  public async updateSettings(newSettings: Partial<AutoModSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await ConfigModel.set('automod_settings', this.settings);
      this.logger.info('Auto-mod settings updated');
    } catch (error) {
      this.logger.error('Failed to update auto-mod settings:', error);
    }
  }

  public getSettings(): AutoModSettings {
    return { ...this.settings };
  }
}

interface AutoModSettings {
  inviteLinks: AutoModRule;
  spam: AutoModRule;
  everyoneMentions: AutoModRule;
  blockedLinks: string[];
}

interface AutoModRule {
  enabled: boolean;
  threshold: number;
  action: 'mute' | 'kick' | 'ban' | 'timeout';
  duration?: number;
}

interface UserViolations {
  counts: Record<string, number>;
  recentMessages: Array<{ content: string; timestamp: number }>;
  lastViolation: number;
}