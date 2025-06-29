"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MassRoleManager = void 0;
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
const helpers_1 = require("@utils/helpers");
class MassRoleManager {
    bot;
    logger;
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('MassRoleManager');
    }
    async massAddRole(targetRoleId, filterRoleId, moderatorId) {
        try {
            const guild = this.bot.client.guilds.cache.first();
            if (!guild) {
                throw new Error('Guild not found');
            }
            const targetRole = guild.roles.cache.get(targetRoleId);
            const filterRole = guild.roles.cache.get(filterRoleId);
            if (!targetRole || !filterRole) {
                throw new Error('One or more roles not found');
            }
            const members = filterRole.members;
            const result = {
                total: members.size,
                successful: 0,
                failed: 0,
                errors: []
            };
            await this.logMassRoleStart('add', targetRole, filterRole, members.size, moderatorId);
            for (const member of members.values()) {
                try {
                    if (!member.roles.cache.has(targetRoleId)) {
                        await member.roles.add(targetRole, `Mass role addition by ${moderatorId}`);
                        result.successful++;
                    }
                    else {
                        result.successful++;
                    }
                    await helpers_1.HelperUtils.sleep(500);
                }
                catch (error) {
                    result.failed++;
                    result.errors.push(`Failed to add role to ${member.user.tag}: ${error}`);
                    this.logger.error(`Failed to add role to ${member.user.tag}:`, error);
                }
            }
            await this.logMassRoleComplete('add', targetRole, filterRole, result, moderatorId);
            this.logger.info(`Mass role add completed: ${result.successful}/${result.total} successful`);
            return result;
        }
        catch (error) {
            this.logger.error('Failed to execute mass role add:', error);
            throw error;
        }
    }
    async massRemoveRole(targetRoleId, filterRoleId, moderatorId) {
        try {
            const guild = this.bot.client.guilds.cache.first();
            if (!guild) {
                throw new Error('Guild not found');
            }
            const targetRole = guild.roles.cache.get(targetRoleId);
            const filterRole = guild.roles.cache.get(filterRoleId);
            if (!targetRole || !filterRole) {
                throw new Error('One or more roles not found');
            }
            const members = filterRole.members;
            const result = {
                total: members.size,
                successful: 0,
                failed: 0,
                errors: []
            };
            await this.logMassRoleStart('remove', targetRole, filterRole, members.size, moderatorId);
            for (const member of members.values()) {
                try {
                    if (member.roles.cache.has(targetRoleId)) {
                        await member.roles.remove(targetRole, `Mass role removal by ${moderatorId}`);
                        result.successful++;
                    }
                    else {
                        result.successful++;
                    }
                    await helpers_1.HelperUtils.sleep(500);
                }
                catch (error) {
                    result.failed++;
                    result.errors.push(`Failed to remove role from ${member.user.tag}: ${error}`);
                    this.logger.error(`Failed to remove role from ${member.user.tag}:`, error);
                }
            }
            await this.logMassRoleComplete('remove', targetRole, filterRole, result, moderatorId);
            this.logger.info(`Mass role remove completed: ${result.successful}/${result.total} successful`);
            return result;
        }
        catch (error) {
            this.logger.error('Failed to execute mass role remove:', error);
            throw error;
        }
    }
    async logMassRoleStart(action, targetRole, filterRole, memberCount, moderatorId) {
        try {
            if (!this.bot.channelManager)
                return;
            const logEmbed = embed_1.EmbedManager.createLogEmbed(`Mass Role ${action === 'add' ? 'Addition' : 'Removal'} Started`, `<@${moderatorId}> started mass ${action} operation`, [
                { name: 'Target Role', value: targetRole.name, inline: true },
                { name: 'Filter Role', value: filterRole.name, inline: true },
                { name: 'Affected Members', value: memberCount.toString(), inline: true }
            ]);
            await this.bot.channelManager.sendLog('modLogs', logEmbed);
        }
        catch (error) {
            this.logger.error('Failed to log mass role start:', error);
        }
    }
    async logMassRoleComplete(action, targetRole, filterRole, result, moderatorId) {
        try {
            if (!this.bot.channelManager)
                return;
            const successRate = (result.successful / result.total * 100).toFixed(1);
            const logEmbed = embed_1.EmbedManager.createLogEmbed(`Mass Role ${action === 'add' ? 'Addition' : 'Removal'} Completed`, `Mass ${action} operation completed by <@${moderatorId}>`, [
                { name: 'Target Role', value: targetRole.name, inline: true },
                { name: 'Filter Role', value: filterRole.name, inline: true },
                { name: 'Success Rate', value: `${successRate}%`, inline: true },
                { name: 'Successful', value: result.successful.toString(), inline: true },
                { name: 'Failed', value: result.failed.toString(), inline: true },
                { name: 'Total', value: result.total.toString(), inline: true }
            ]);
            if (result.errors.length > 0) {
                const errorText = result.errors.slice(0, 5).join('\n');
                logEmbed.addFields({
                    name: 'Errors (First 5)',
                    value: errorText.substring(0, 1000),
                    inline: false
                });
            }
            await this.bot.channelManager.sendLog('modLogs', logEmbed);
        }
        catch (error) {
            this.logger.error('Failed to log mass role complete:', error);
        }
    }
}
exports.MassRoleManager = MassRoleManager;
//# sourceMappingURL=massRole.js.map