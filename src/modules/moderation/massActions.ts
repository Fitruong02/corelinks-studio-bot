// ===== src/modules/moderation/actions.ts =====
import { CorelinksBot } from '../../bot';
import { GuildMember, User, TextChannel } from 'discord.js';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';
import { PermissionManager } from '@utils/permissions';

export class ModerationActionManager {
  private bot: CorelinksBot;
  private logger: Logger;
  private actionHistory: Map<string, ModerationAction[]> = new Map();

  constructor(bot: CorelinksBot) {
    this.bot = bot;
    this.logger = new Logger('ModerationActionManager');
  }

  async executeAction(
    action: ModerationActionType,
    target: GuildMember | User,
    moderator: GuildMember,
    options: ModerationActionOptions
  ): Promise<boolean> {
    try {
      const targetUser = target instanceof GuildMember ? target.user : target;
      const targetMember = target instanceof GuildMember ? target : null;

      // Permission check
      if (targetMember && !PermissionManager.canModerate(moderator, targetMember)) {
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
          success = await this.banUser(target, moderator, options.duration !== undefined ? options.duration : null, options.reason || '');
          break;
        case 'unban':
          success = await this.unbanUser(targetUser, moderator, options.reason || '');
          break;
        default:
          this.logger.warn(`Unknown moderation action: ${action}`);
          return false;
      }

      if (success) {
        // Record action in history
        this.recordAction(targetUser.id, {
          type: action,
          moderatorId: moderator.id,
          reason: options.reason || '',
          duration: options.duration,
          timestamp: new Date()
        });
      }

      return success;

    } catch (error) {
      this.logger.error('Failed to execute moderation action:', error);
      return false;
    }
  }

  private async warnUser(target: GuildMember, moderator: GuildMember, reason: string): Promise<boolean> {
    try {
      const { ModerationManager } = await import('./index');
      const modManager = new ModerationManager(this.bot);
      return await modManager.warnUser(target, moderator, reason);
    } catch (error) {
      this.logger.error('Failed to warn user:', error);
      return false;
    }
  }

  private async timeoutUser(target: GuildMember, moderator: GuildMember, duration: number, reason: string): Promise<boolean> {
    try {
      const { ModerationManager } = await import('./index');
      const modManager = new ModerationManager(this.bot);
      return await modManager.timeoutUser(target, moderator, duration, reason);
    } catch (error) {
      this.logger.error('Failed to timeout user:', error);
      return false;
    }
  }

  private async muteUser(target: GuildMember, moderator: GuildMember, duration: number, reason: string): Promise<boolean> {
    try {
      const { ModerationManager } = await import('./index');
      const modManager = new ModerationManager(this.bot);
      return await modManager.muteUser(target, moderator, duration, reason);
    } catch (error) {
      this.logger.error('Failed to mute user:', error);
      return false;
    }
  }

  private async kickUser(target: GuildMember, moderator: GuildMember, reason: string): Promise<boolean> {
    try {
      const { ModerationManager } = await import('./index');
      const modManager = new ModerationManager(this.bot);
      return await modManager.kickUser(target, moderator, reason);
    } catch (error) {
      this.logger.error('Failed to kick user:', error);
      return false;
    }
  }

  private async banUser(target: GuildMember | User, moderator: GuildMember, duration: number | null, reason: string): Promise<boolean> {
    try {
      const { ModerationManager } = await import('./index');
      const modManager = new ModerationManager(this.bot);
      return await modManager.banUser(target, moderator, duration, reason);
    } catch (error) {
      this.logger.error('Failed to ban user:', error);
      return false;
    }
  }

  private async unbanUser(target: User, moderator: GuildMember, reason: string): Promise<boolean> {
    try {
      await moderator.guild.members.unban(target, reason);

      // Log the action
      if (this.bot.channelManager) {
        const logEmbed = EmbedManager.createModerationEmbed(
          'Unban',
          target.tag,
          reason,
          moderator.user.tag
        );

        await this.bot.channelManager.sendLog('modLogs', logEmbed);
      }

      this.logger.info(`${moderator.user.tag} unbanned ${target.tag}: ${reason}`);
      return true;

    } catch (error) {
      this.logger.error('Failed to unban user:', error);
      return false;
    }
  }

  async getUserHistory(userId: string, limit: number = 10): Promise<ModerationAction[]> {
    const history = this.actionHistory.get(userId) || [];
    return history.slice(-limit).reverse(); // Most recent first
  }

  async getModeratorStats(moderatorId: string, days: number = 30): Promise<ModeratorStats> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    let totalActions = 0;
    const actionCounts: Record<ModerationActionType, number> = {
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

  private recordAction(userId: string, action: ModerationAction): void {
    const history = this.actionHistory.get(userId) || [];
    history.push(action);
    
    // Keep only last 50 actions per user
    if (history.length > 50) {
      history.shift();
    }
    
    this.actionHistory.set(userId, history);
  }

  public getActionHistory(): Map<string, ModerationAction[]> {
    return new Map(this.actionHistory);
  }
}

type ModerationActionType = 'warn' | 'timeout' | 'mute' | 'kick' | 'ban' | 'unban';

interface ModerationActionOptions {
  reason?: string;
  duration?: number;
}

interface ModerationAction {
  type: ModerationActionType;
  moderatorId: string;
  reason: string;
  duration?: number;
  timestamp: Date;
}

interface ModeratorStats {
  totalActions: number;
  actionCounts: Record<ModerationActionType, number>;
  period: number;
}

export class MassModerationManager extends ModerationActionManager {
  async massKickByRole(roleId: string, moderator: any, reason: string): Promise<boolean> {
    // Implement your logic here
    return false;
  }
  async massTimeoutNewMembers(hours: number, moderator: any, reason: string, duration: number): Promise<boolean> {
    // Implement your logic here
    return false;
  }
}
