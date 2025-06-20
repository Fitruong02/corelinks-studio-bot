// ===== src/modules/role/picker.ts =====
import { CorelinksBot } from '../../bot';
import { TextChannel, Message, MessageReaction, User } from 'discord.js';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';
import { HelperUtils } from '@utils/helpers';

export class RolePickerManager {
  private bot: CorelinksBot;
  private logger: Logger;
  private rolePickers: Map<string, RolePickerData> = new Map(); // messageId -> data

  constructor(bot: CorelinksBot) {
    this.bot = bot;
    this.logger = new Logger('RolePickerManager');
  }

  async createRolePicker(title: string, description: string, channelId: string, creatorId: string): Promise<boolean> {
    try {
      const channel = await this.bot.client.channels.fetch(channelId) as TextChannel;
      if (!channel) {
        this.logger.warn(`Channel not found: ${channelId}`);
        return false;
      }

      const rolePickerEmbed = EmbedManager.createInfoEmbed(title, description);
      rolePickerEmbed.addFields({
        name: 'How to use',
        value: 'React with an emoji below to get the corresponding role. React again to remove the role.',
        inline: false
      });

      const message = await channel.send({ embeds: [rolePickerEmbed] });

      const rolePickerData: RolePickerData = {
        messageId: message.id,
        channelId: channel.id,
        title,
        description,
        roles: new Map(),
        creatorId,
        createdAt: new Date()
      };

      this.rolePickers.set(message.id, rolePickerData);

      this.logger.info(`Created role picker: ${title} in ${channel.name}`);
      return true;

    } catch (error) {
      this.logger.error('Failed to create role picker:', error);
      return false;
    }
  }

  async addRoleToRolePicker(messageId: string, roleId: string, emoji: string, description: string): Promise<boolean> {
    try {
      const rolePicker = this.rolePickers.get(messageId);
      if (!rolePicker) {
        this.logger.warn(`Role picker not found: ${messageId}`);
        return false;
      }

      const channel = await this.bot.client.channels.fetch(rolePicker.channelId) as TextChannel;
      const message = await channel.messages.fetch(messageId);
      const guild = channel.guild;
      const role = guild.roles.cache.get(roleId);

      if (!role) {
        this.logger.warn(`Role not found: ${roleId}`);
        return false;
      }

      // Add role to picker data
      rolePicker.roles.set(emoji, {
        roleId,
        roleName: role.name,
        description,
        emoji
      });

      // Add reaction to message
      try {
        await message.react(emoji);
      } catch (error) {
        this.logger.warn(`Failed to add reaction ${emoji}:`, error);
      }

      // Update embed
      await this.updateRolePickerEmbed(message, rolePicker);

      this.logger.info(`Added role ${role.name} with emoji ${emoji} to role picker ${messageId}`);
      return true;

    } catch (error) {
      this.logger.error('Failed to add role to role picker:', error);
      return false;
    }
  }

  async handleReactionRoleToggle(messageId: string, userId: string, emoji: string, added: boolean): Promise<void> {
    try {
      const rolePicker = this.rolePickers.get(messageId);
      if (!rolePicker) return;

      const roleData = rolePicker.roles.get(emoji);
      if (!roleData) return;

      const guild = this.bot.client.guilds.cache.first();
      if (!guild) return;

      const member = await guild.members.fetch(userId);
      const role = guild.roles.cache.get(roleData.roleId);

      if (!member || !role) return;

      if (added) {
        if (!member.roles.cache.has(role.id)) {
          await member.roles.add(role, 'Role picker reaction');
          await this.logRolePickerAction('add', member.user, role, 'reaction');
        }
      } else {
        if (member.roles.cache.has(role.id)) {
          await member.roles.remove(role, 'Role picker reaction removed');
          await this.logRolePickerAction('remove', member.user, role, 'reaction');
        }
      }

    } catch (error) {
      this.logger.error('Failed to handle reaction role toggle:', error);
    }
  }

  async handleRoleSelection(interaction: any, params: string[]): Promise<void> {
    try {
      // This would handle select menu interactions for role picking
      // Implementation depends on specific select menu structure
      const errorEmbed = EmbedManager.createInfoEmbed(
        'Role Selection',
        'Role selection via select menu is not yet implemented. Please use reaction-based role picking.'
      );
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });

    } catch (error) {
      this.logger.error('Failed to handle role selection:', error);
    }
  }

  private async updateRolePickerEmbed(message: Message, rolePicker: RolePickerData): Promise<void> {
    try {
      const updatedEmbed = EmbedManager.createInfoEmbed(rolePicker.title, rolePicker.description);

      // Add role options
      const roleList = Array.from(rolePicker.roles.values())
        .map(role => `${role.emoji} - ${role.roleName}${role.description ? ` (${role.description})` : ''}`)
        .join('\n');

      if (roleList) {
        updatedEmbed.addFields({
          name: 'Available Roles',
          value: roleList,
          inline: false
        });
      }

      updatedEmbed.addFields({
        name: 'How to use',
        value: 'React with an emoji below to get the corresponding role. React again to remove the role.',
        inline: false
      });

      await message.edit({ embeds: [updatedEmbed] });

    } catch (error) {
      this.logger.error('Failed to update role picker embed:', error);
    }
  }

  private async logRolePickerAction(action: 'add' | 'remove', user: User, role: any, method: string): Promise<void> {
    try {
      if (!this.bot.channelManager) return;

      const logEmbed = EmbedManager.createLogEmbed(
        `Role Picker ${action === 'add' ? 'Added' : 'Removed'}`,
        `${HelperUtils.formatUserTag(user)} ${action === 'add' ? 'gained' : 'lost'} role ${role.name} via ${method}`,
        [
          { name: 'Role', value: role.name, inline: true },
          { name: 'Method', value: method, inline: true },
          { name: 'User', value: HelperUtils.formatUserTag(user), inline: true }
        ]
      );

      await this.bot.channelManager.sendLog('modLogs', logEmbed);

    } catch (error) {
      this.logger.error('Failed to log role picker action:', error);
    }
  }

  public getRolePickers(): Map<string, RolePickerData> {
    return new Map(this.rolePickers);
  }

  public isRolePickerMessage(messageId: string): boolean {
    return this.rolePickers.has(messageId);
  }
}

interface RolePickerData {
  messageId: string;
  channelId: string;
  title: string;
  description: string;
  roles: Map<string, RolePickerRole>; // emoji -> role data
  creatorId: string;
  createdAt: Date;
}

interface RolePickerRole {
  roleId: string;
  roleName: string;
  description: string;
  emoji: string;
}
