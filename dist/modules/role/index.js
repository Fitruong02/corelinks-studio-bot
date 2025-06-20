"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleManager = void 0;
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
const helpers_1 = require("@utils/helpers");
const picker_1 = require("./picker");
const massRole_1 = require("./massRole");
class RoleManager {
    bot;
    logger;
    rolePickerManager;
    massRoleManager;
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('RoleManager');
        this.rolePickerManager = new picker_1.RolePickerManager(bot);
        this.massRoleManager = new massRole_1.MassRoleManager(bot);
    }
    async addRole(member, roleId, moderatorId) {
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
            await this.logRoleAction('add', member, role, moderatorId);
            this.logger.info(`Added role ${role.name} to ${member.user.tag}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to add role:', error);
            return false;
        }
    }
    async removeRole(member, roleId, moderatorId) {
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
            await this.logRoleAction('remove', member, role, moderatorId);
            this.logger.info(`Removed role ${role.name} from ${member.user.tag}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to remove role:', error);
            return false;
        }
    }
    async massAddRole(targetRoleId, filterRoleId, moderatorId) {
        try {
            return await this.massRoleManager.massAddRole(targetRoleId, filterRoleId, moderatorId);
        }
        catch (error) {
            this.logger.error('Failed to mass add role:', error);
            return { total: 0, successful: 0, failed: 0, errors: ['Mass add operation failed'] };
        }
    }
    async massRemoveRole(targetRoleId, filterRoleId, moderatorId) {
        try {
            return await this.massRoleManager.massRemoveRole(targetRoleId, filterRoleId, moderatorId);
        }
        catch (error) {
            this.logger.error('Failed to mass remove role:', error);
            return { total: 0, successful: 0, failed: 0, errors: ['Mass remove operation failed'] };
        }
    }
    async createRolePicker(title, description, channelId, creatorId) {
        try {
            return await this.rolePickerManager.createRolePicker(title, description, channelId, creatorId);
        }
        catch (error) {
            this.logger.error('Failed to create role picker:', error);
            return false;
        }
    }
    async addRoleToRolePicker(messageId, roleId, emoji, description) {
        try {
            return await this.rolePickerManager.addRoleToRolePicker(messageId, roleId, emoji, description);
        }
        catch (error) {
            this.logger.error('Failed to add role to role picker:', error);
            return false;
        }
    }
    async handleRoleSelection(interaction, params) {
        try {
            await this.rolePickerManager.handleRoleSelection(interaction, params);
        }
        catch (error) {
            this.logger.error('Failed to handle role selection:', error);
        }
    }
    async handleReactionRoleToggle(messageId, userId, emoji, added) {
        try {
            await this.rolePickerManager.handleReactionRoleToggle(messageId, userId, emoji, added);
        }
        catch (error) {
            this.logger.error('Failed to handle reaction role toggle:', error);
        }
    }
    async logRoleAction(action, member, role, moderatorId) {
        try {
            if (!this.bot.channelManager)
                return;
            const logEmbed = embed_1.EmbedManager.createLogEmbed(`Role ${action === 'add' ? 'Added' : 'Removed'}`, `Role ${role.name} ${action === 'add' ? 'added to' : 'removed from'} ${helpers_1.HelperUtils.formatUserTag(member.user)}`, [
                { name: 'Role', value: role.name, inline: true },
                { name: 'User', value: helpers_1.HelperUtils.formatUserTag(member.user), inline: true },
                { name: 'Moderator', value: `<@${moderatorId}>`, inline: true }
            ]);
            await this.bot.channelManager.sendLog('modLogs', logEmbed);
        }
        catch (error) {
            this.logger.error('Failed to log role action:', error);
        }
    }
    getRolePickerManager() {
        return this.rolePickerManager;
    }
    getMassRoleManager() {
        return this.massRoleManager;
    }
}
exports.RoleManager = RoleManager;
//# sourceMappingURL=index.js.map