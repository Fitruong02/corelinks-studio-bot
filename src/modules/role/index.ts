// ===== src/modules/role/index.ts =====
import { CorelinksBot } from '../../bot';
import { GuildMember, Role, Message } from 'discord.js';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';
import { HelperUtils } from '@utils/helpers';
import { RolePickerManager } from './picker';
import { MassRoleManager } from './massRole';

export class RoleManager {
  private bot: CorelinksBot;
  private logger: Logger;
  private rolePickerManager: RolePickerManager;
  private massRoleManager: MassRoleManager;

  constructor(bot: CorelinksBot) {
    this.bot = bot;
    this.logger = new Logger('RoleManager');
    this.rolePickerManager = new RolePickerManager(bot);
    this.massRoleManager = new MassRoleManager(bot);
  }

  async addRole(member: GuildMember, roleId: string, moderatorId: string): Promise<boolean> {
    try {
      const role = member.guild.roles.cache.get(roleId);
      if (!role) {
        this.logger.warn(`Role not found: ${roleId}`);
        return false;
      }

      if (member.roles.cache.has(roleId)) {
        this.logger.info(`User ${member.user.tag} already has role ${role.name}`);
        return true;
      }

      await member.roles.add(role, `Added by ${moderatorId}`);

      // Log role addition
      await this.logRoleAction('add', member, role, moderatorId);

      this.logger.info(`Added role ${role.name} to ${member.user.tag}`);
      return true;

    } catch (error) {
      this.logger.error('Failed to add role:', error);
      return false;
    }
  }

  async removeRole(member: GuildMember, roleId: string, moderatorId: string): Promise<boolean> {
    try {
      const role = member.guild.roles.cache.get(roleId);
      if (!role) {
        this.logger.warn(`Role not found: ${roleId}`);
        return false;
      }

      if (!member.roles.cache.has(roleId)) {
        this.logger.info(`User ${member.user.tag} doesn't have role ${role.name}`);
        return true;
      }

      await member.roles.remove(role, `Removed by ${moderatorId}`);

      // Log role removal
      await this.logRoleAction('remove', member, role, moderatorId);

      this.logger.info(`Removed role ${role.name} from ${member.user.tag}`);
      return true;

    } catch (error) {
      this.logger.error('Failed to remove role:', error);
      return false;
    }
  }

  async massAddRole(targetRoleId: string, filterRoleId: string, moderatorId: string): Promise<MassRoleResult> {
    try {
      return await this.massRoleManager.massAddRole(targetRoleId, filterRoleId, moderatorId);
    } catch (error) {
      this.logger.error('Failed to mass add role:', error);
      return { total: 0, successful: 0, failed: 0, errors: ['Mass add operation failed'] };
    }
  }

  async massRemoveRole(targetRoleId: string, filterRoleId: string, moderatorId: string): Promise<MassRoleResult> {
    try {
      return await this.massRoleManager.massRemoveRole(targetRoleId, filterRoleId, moderatorId);
    } catch (error) {
      this.logger.error('Failed to mass remove role:', error);
      return { total: 0, successful: 0, failed: 0, errors: ['Mass remove operation failed'] };
    }
  }

  async createRolePicker(title: string, description: string, channelId: string, creatorId: string): Promise<boolean> {
    try {
      return await this.rolePickerManager.createRolePicker(title, description, channelId, creatorId);
    } catch (error) {
      this.logger.error('Failed to create role picker:', error);
      return false;
    }
  }

  async addRoleToRolePicker(messageId: string, roleId: string, emoji: string, description: string): Promise<boolean> {
    try {
      return await this.rolePickerManager.addRoleToRolePicker(messageId, roleId, emoji, description);
    } catch (error) {
      this.logger.error('Failed to add role to role picker:', error);
      return false;
    }
  }

  async handleRoleSelection(interaction: any, params: string[]): Promise<void> {
    try {
      await this.rolePickerManager.handleRoleSelection(interaction, params);
    } catch (error) {
      this.logger.error('Failed to handle role selection:', error);
    }
  }

  async handleReactionRoleToggle(messageId: string, userId: string, emoji: string, added: boolean): Promise<void> {
    try {
      await this.rolePickerManager.handleReactionRoleToggle(messageId, userId, emoji, added);
    } catch (error) {
      this.logger.error('Failed to handle reaction role toggle:', error);
    }
  }

  private async logRoleAction(action: 'add' | 'remove', member: GuildMember, role: Role, moderatorId: string): Promise<void> {
    try {
      if (!this.bot.channelManager) return;

      const logEmbed = EmbedManager.createLogEmbed(
        `Role ${action === 'add' ? 'Added' : 'Removed'}`,
        `Role ${role.name} ${action === 'add' ? 'added to' : 'removed from'} ${HelperUtils.formatUserTag(member.user)}`,
        [
          { name: 'Role', value: role.name, inline: true },
          { name: 'User', value: HelperUtils.formatUserTag(member.user), inline: true },
          { name: 'Moderator', value: `<@${moderatorId}>`, inline: true }
        ]
      );

      await this.bot.channelManager.sendLog('modLogs', logEmbed);

    } catch (error) {
      this.logger.error('Failed to log role action:', error);
    }
  }

  public getRolePickerManager(): RolePickerManager {
    return this.rolePickerManager;
  }

  public getMassRoleManager(): MassRoleManager {
    return this.massRoleManager;
  }
}

interface MassRoleResult {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}