"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionManager = void 0;
const config_1 = require("@config/config");
const logger_1 = require("@utils/logger");
class PermissionManager {
    static logger = new logger_1.Logger('PermissionManager');
    static isFounder(member) {
        return member.roles.cache.has(config_1.config.roles.founder);
    }
    static isStaff(member) {
        return member.roles.cache.has(config_1.config.roles.staff) || this.isFounder(member);
    }
    static isCustomer(member) {
        return member.roles.cache.has(config_1.config.roles.customer);
    }
    static hasPermission(member, requiredRole) {
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
    static async grantCustomerRole(member) {
        try {
            const customerRole = member.guild.roles.cache.get(config_1.config.roles.customer);
            if (!customerRole) {
                this.logger.error('Customer role not found');
                return false;
            }
            await member.roles.add(customerRole);
            this.logger.info(`Granted Customer role to ${member.user.tag}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to grant Customer role:', error);
            return false;
        }
    }
    static async removeRole(member, roleId) {
        try {
            const role = member.guild.roles.cache.get(roleId);
            if (!role) {
                this.logger.error(`Role ${roleId} not found`);
                return false;
            }
            await member.roles.remove(role);
            this.logger.info(`Removed role ${role.name} from ${member.user.tag}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to remove role:', error);
            return false;
        }
    }
    static async addRole(member, roleId) {
        try {
            const role = member.guild.roles.cache.get(roleId);
            if (!role) {
                this.logger.error(`Role ${roleId} not found`);
                return false;
            }
            await member.roles.add(role);
            this.logger.info(`Added role ${role.name} to ${member.user.tag}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to add role:', error);
            return false;
        }
    }
    static getRoleHierarchy(guild) {
        return guild.roles.cache
            .filter(role => role.name !== '@everyone')
            .sort((a, b) => b.position - a.position)
            .map(role => role);
    }
    static canModerate(moderator, target) {
        if (this.isFounder(moderator)) {
            return !this.isFounder(target) || moderator.id === target.id;
        }
        if (this.isStaff(moderator)) {
            return !this.isStaff(target) && !this.isFounder(target);
        }
        return false;
    }
}
exports.PermissionManager = PermissionManager;
//# sourceMappingURL=permissions.js.map