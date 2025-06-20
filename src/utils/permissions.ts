// ===== src/utils/permissions.ts =====
import { Guild, GuildMember, Role } from 'discord.js';
import { config } from '@config/config';
import { Logger } from '@utils/logger';

export class PermissionManager {
  private static logger = new Logger('PermissionManager');

  static isFounder(member: GuildMember): boolean {
    return member.roles.cache.has(config.roles.founder);
  }

  static isStaff(member: GuildMember): boolean {
    return member.roles.cache.has(config.roles.staff) || this.isFounder(member);
  }

  static isCustomer(member: GuildMember): boolean {
    return member.roles.cache.has(config.roles.customer);
  }

  static hasPermission(member: GuildMember, requiredRole: 'founder' | 'staff' | 'customer'): boolean {
    switch (requiredRole) {
      case 'founder':
        return this.isFounder(member);
      case 'staff':
        return this.isStaff(member);
      case 'customer':
        return this.isCustomer(member);
      default:
        return false;
    }
  }

  static async grantCustomerRole(member: GuildMember): Promise<boolean> {
    try {
      const customerRole = member.guild.roles.cache.get(config.roles.customer);
      if (!customerRole) {
        this.logger.error('Customer role not found');
        return false;
      }

      await member.roles.add(customerRole);
      this.logger.info(`Granted Customer role to ${member.user.tag}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to grant Customer role:', error);
      return false;
    }
  }

  static async removeRole(member: GuildMember, roleId: string): Promise<boolean> {
    try {
      const role = member.guild.roles.cache.get(roleId);
      if (!role) {
        this.logger.error(`Role ${roleId} not found`);
        return false;
      }

      await member.roles.remove(role);
      this.logger.info(`Removed role ${role.name} from ${member.user.tag}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to remove role:', error);
      return false;
    }
  }

  static async addRole(member: GuildMember, roleId: string): Promise<boolean> {
    try {
      const role = member.guild.roles.cache.get(roleId);
      if (!role) {
        this.logger.error(`Role ${roleId} not found`);
        return false;
      }

      await member.roles.add(role);
      this.logger.info(`Added role ${role.name} to ${member.user.tag}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to add role:', error);
      return false;
    }
  }

  static getRoleHierarchy(guild: Guild): Role[] {
    return guild.roles.cache
      .filter(role => role.name !== '@everyone')
      .sort((a, b) => b.position - a.position)
      .map(role => role);
  }

  static canModerate(moderator: GuildMember, target: GuildMember): boolean {
    // Founders can moderate anyone except other founders
    if (this.isFounder(moderator)) {
      return !this.isFounder(target) || moderator.id === target.id;
    }

    // Staff can moderate customers but not other staff or founders
    if (this.isStaff(moderator)) {
      return !this.isStaff(target) && !this.isFounder(target);
    }

    return false;
  }
}