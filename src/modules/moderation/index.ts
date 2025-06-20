// ===== src/modules/moderation/index.ts =====
import { CorelinksBot } from '../../bot';
import { GuildMember, User, TextChannel, Message } from 'discord.js';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';
import { PermissionManager } from '@utils/permissions';
import { HelperUtils } from '@utils/helpers';
import { ValidationManager } from '@utils/validation';
import { AutoModerationManager } from './automod';
import { ModerationActionManager } from './actions';
import { MassModerationManager } from './massActions';

export class ModerationManager {
  private bot: CorelinksBot;
  private logger: Logger;
  private autoMod: AutoModerationManager;
  private actionManager: ModerationActionManager;
  private massActionManager: MassModerationManager;
  private warnings: Map<string, UserWarning[]> = new Map(); // userId -> warnings[]

  constructor(bot: CorelinksBot) {
    this.bot = bot;
    this.logger = new Logger('ModerationManager');
    this.autoMod = new AutoModerationManager(bot);
    this.actionManager = new ModerationActionManager(bot);
    this.massActionManager = new MassModerationManager(bot);
  }

  async warnUser(target: GuildMember, moderator: GuildMember, reason: string): Promise<boolean> {
    try {
      if (!PermissionManager.canModerate(moderator, target)) {
        return false;
      }

      const warning: UserWarning = {
        id: Date.now().toString(),
        userId: target.id,
        moderatorId: moderator.id,
        reason,
        timestamp: new Date()
      };

      // Store warning
      const userWarnings = this.warnings.get(target.id) || [];
      userWarnings.push(warning);
      this.warnings.set(target.id, userWarnings);

      // Send DM to user
      const warningEmbed = EmbedManager.createWarningEmbed(
        'Warning Received',
        `You have received a warning in ${target.guild.name}`
      );

      warningEmbed.addFields(
        { name: 'Reason', value: reason, inline: false },
        { name: 'Moderator', value: moderator.user.tag, inline: true },
        { name: 'Date', value: HelperUtils.formatTimestamp(new Date()), inline: true },
        { name: 'Total Warnings', value: userWarnings.length.toString(), inline: true }
      );

      await HelperUtils.safeDMSend(target.user, warningEmbed);

      // Log moderation action
      await this.logModerationAction('Warning', target.user, moderator.user, reason);

      this.logger.info(`${moderator.user.tag} warned ${target.user.tag}: ${reason}`);
      return true;

    } catch (error) {
      this.logger.error('Failed to warn user:', error);
      return false;
    }
  }

  async timeoutUser(target: GuildMember, moderator: GuildMember, duration: number, reason: string): Promise<boolean> {
    try {
      if (!PermissionManager.canModerate(moderator, target)) {
        return false;
      }

      const timeoutUntil = new Date(Date.now() + duration * 1000);
      await target.timeout(duration * 1000, reason);

      // Send DM to user
      const timeoutEmbed = EmbedManager.createWarningEmbed(
        'Timeout Applied',
        `You have been timed out in ${target.guild.name}`
      );

      timeoutEmbed.addFields(
        { name: 'Duration', value: this.formatDuration(duration), inline: true },
        { name: 'Until', value: HelperUtils.formatTimestamp(timeoutUntil), inline: true },
        { name: 'Reason', value: reason, inline: false }
      );

      await HelperUtils.safeDMSend(target.user, timeoutEmbed);

      // Log moderation action
      await this.logModerationAction('Timeout', target.user, moderator.user, `${this.formatDuration(duration)} - ${reason}`);

      this.logger.info(`${moderator.user.tag} timed out ${target.user.tag} for ${this.formatDuration(duration)}: ${reason}`);
      return true;

    } catch (error) {
      this.logger.error('Failed to timeout user:', error);
      return false;
    }
  }

  async muteUser(target: GuildMember, moderator: GuildMember, duration: number, reason: string): Promise<boolean> {
    try {
      if (!PermissionManager.canModerate(moderator, target)) {
        return false;
      }

      // Apply timeout (Discord's mute system)
      await target.timeout(duration * 1000, reason);

      // Send DM to user
      const muteEmbed = EmbedManager.createWarningEmbed(
        'Muted',
        `You have been muted in ${target.guild.name}`
      );

      muteEmbed.addFields(
        { name: 'Duration', value: this.formatDuration(duration), inline: true },
        { name: 'Reason', value: reason, inline: false }
      );

      await HelperUtils.safeDMSend(target.user, muteEmbed);

      // Log moderation action
      await this.logModerationAction('Mute', target.user, moderator.user, `${this.formatDuration(duration)} - ${reason}`);

      this.logger.info(`${moderator.user.tag} muted ${target.user.tag} for ${this.formatDuration(duration)}: ${reason}`);
      return true;

    } catch (error) {
      this.logger.error('Failed to mute user:', error);
      return false;
    }
  }

  async kickUser(target: GuildMember, moderator: GuildMember, reason: string): Promise<boolean> {
    try {
      if (!PermissionManager.canModerate(moderator, target)) {
        return false;
      }

      // Send DM before kicking
      const kickEmbed = EmbedManager.createErrorEmbed(
        'Kicked from Server',
        `You have been kicked from ${target.guild.name}`
      );

      kickEmbed.addFields(
        { name: 'Reason', value: reason, inline: false },
        { name: 'Moderator', value: moderator.user.tag, inline: true }
      );

      await HelperUtils.safeDMSend(target.user, kickEmbed);

      // Kick the user
      await target.kick(reason);

      // Log moderation action
      await this.logModerationAction('Kick', target.user, moderator.user, reason);

      this.logger.info(`${moderator.user.tag} kicked ${target.user.tag}: ${reason}`);
      return true;

    } catch (error) {
      this.logger.error('Failed to kick user:', error);
      return false;
    }
  }

  async banUser(target: GuildMember | User, moderator: GuildMember, duration: number | null, reason: string): Promise<boolean> {
    try {
      const targetUser = target instanceof GuildMember ? target.user : target;
      const targetMember = target instanceof GuildMember ? target : null;

      if (targetMember && !PermissionManager.canModerate(moderator, targetMember)) {
        return false;
      }

      // Send DM before banning
      const banEmbed = EmbedManager.createErrorEmbed(
        'Banned from Server',
        `You have been banned from ${moderator.guild.name}`
      );

      banEmbed.addFields(
        { name: 'Duration', value: duration ? this.formatDuration(duration) : 'Permanent', inline: true },
        { name: 'Reason', value: reason, inline: false },
        { name: 'Moderator', value: moderator.user.tag, inline: true }
      );

      await HelperUtils.safeDMSend(targetUser, banEmbed);

      // Ban the user
      await moderator.guild.members.ban(targetUser, { reason, deleteMessageDays: 1 });

      // Schedule unban if temporary
      if (duration) {
        setTimeout(async () => {
          try {
            await moderator.guild.members.unban(targetUser, 'Temporary ban expired');
            await this.logModerationAction('Unban', targetUser, this.bot.client.user!, 'Temporary ban expired');
          } catch (error) {
            this.logger.error('Failed to auto-unban user:', error);
          }
        }, duration * 1000);
      }

      // Log moderation action
      const durationText = duration ? this.formatDuration(duration) : 'Permanent';
      await this.logModerationAction('Ban', targetUser, moderator.user, `${durationText} - ${reason}`);

      this.logger.info(`${moderator.user.tag} banned ${targetUser.tag} (${durationText}): ${reason}`);
      return true;

    } catch (error) {
      this.logger.error('Failed to ban user:', error);
      return false;
    }
  }

  async roleLockUser(target: GuildMember, moderator: GuildMember, duration: number, reason: string): Promise<boolean> {
    try {
      if (!PermissionManager.canModerate(moderator, target)) {
        return false;
      }

      // Store current roles
      const currentRoles = target.roles.cache
        .filter(role => role.name !== '@everyone')
        .map(role => role.id);

      // Remove all roles except @everyone
      await target.roles.set([], reason);

      // Send DM to user
      const roleLockEmbed = EmbedManager.createWarningEmbed(
        'Role Lock Applied',
        `Your roles have been temporarily removed in ${target.guild.name}`
      );

      roleLockEmbed.addFields(
        { name: 'Duration', value: this.formatDuration(duration), inline: true },
        { name: 'Reason', value: reason, inline: false }
      );

      await HelperUtils.safeDMSend(target.user, roleLockEmbed);

      // Schedule role restoration
      setTimeout(async () => {
        try {
          if (target.guild.members.cache.has(target.id)) {
            await target.roles.add(currentRoles, 'Role lock expired');
            await this.logModerationAction('Role Unlock', target.user, this.bot.client.user!, 'Role lock expired');
          }
        } catch (error) {
          this.logger.error('Failed to restore roles:', error);
        }
      }, duration * 1000);

      // Log moderation action
      await this.logModerationAction('Role Lock', target.user, moderator.user, `${this.formatDuration(duration)} - ${reason}`);

      this.logger.info(`${moderator.user.tag} role-locked ${target.user.tag} for ${this.formatDuration(duration)}: ${reason}`);
      return true;

    } catch (error) {
      this.logger.error('Failed to role lock user:', error);
      return false;
    }
  }

  async clearMessages(channel: TextChannel, amount: number, moderator: GuildMember, filter?: (msg: Message) => boolean): Promise<number> {
    try {
      if (amount > 100) amount = 100; // Discord limit

      const messages = await channel.messages.fetch({ limit: amount });
      const filteredMessages = filter ? messages.filter(filter) : messages;
      const deletedMessages = await channel.bulkDelete(filteredMessages, true);

      // Log moderation action
      await this.logModerationAction('Clear Messages', null, moderator.user, `Cleared ${deletedMessages.size} messages in ${channel.name}`);

      this.logger.info(`${moderator.user.tag} cleared ${deletedMessages.size} messages in ${channel.name}`);
      return deletedMessages.size;

    } catch (error) {
      this.logger.error('Failed to clear messages:', error);
      return 0;
    }
  }

  async getUserWarnings(userId: string): Promise<UserWarning[]> {
    return this.warnings.get(userId) || [];
  }

  async removeWarning(userId: string, warningId: string, moderator: GuildMember): Promise<boolean> {
    try {
      const userWarnings = this.warnings.get(userId) || [];
      const warningIndex = userWarnings.findIndex(w => w.id === warningId);

      if (warningIndex === -1) return false;

      userWarnings.splice(warningIndex, 1);
      this.warnings.set(userId, userWarnings);

      // Log action
      await this.logModerationAction('Warning Removed', null, moderator.user, `Removed warning ${warningId} from <@${userId}>`);

      this.logger.info(`${moderator.user.tag} removed warning ${warningId} from user ${userId}`);
      return true;

    } catch (error) {
      this.logger.error('Failed to remove warning:', error);
      return false;
    }
  }

  private async logModerationAction(action: string, target: User | null, moderator: User, details: string): Promise<void> {
    try {
      if (!this.bot.channelManager) return;

      const logEmbed = EmbedManager.createModerationEmbed(
        action,
        target ? HelperUtils.formatUserTag(target) : 'N/A',
        details,
        HelperUtils.formatUserTag(moderator)
      );

      await this.bot.channelManager.sendLog('modLogs', logEmbed);

    } catch (error) {
      this.logger.error('Failed to log moderation action:', error);
    }
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);

    return parts.join(' ') || '0s';
  }

  // Public getters for other components
  public getAutoMod(): AutoModerationManager {
    return this.autoMod;
  }

  public getActionManager(): ModerationActionManager {
    return this.actionManager;
  }

  public getMassActionManager(): MassModerationManager {
    return this.massActionManager;
  }
}

interface UserWarning {
  id: string;
  userId: string;
  moderatorId: string;
  reason: string;
  timestamp: Date;
}
