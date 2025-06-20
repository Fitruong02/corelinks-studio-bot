"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePickerManager = void 0;
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
const helpers_1 = require("@utils/helpers");
class RolePickerManager {
    bot;
    logger;
    rolePickers = new Map();
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('RolePickerManager');
    }
    async createRolePicker(title, description, channelId, creatorId) {
        try {
            const channel = await this.bot.client.channels.fetch(channelId);
            if (!channel) {
                this.logger.warn(`Channel not found: ${channelId}`);
                return false;
            }
            const rolePickerEmbed = embed_1.EmbedManager.createInfoEmbed(title, description);
            rolePickerEmbed.addFields({
                name: 'How to use',
                value: 'React with an emoji below to get the corresponding role. React again to remove the role.',
                inline: false
            });
            const message = await channel.send({ embeds: [rolePickerEmbed] });
            const rolePickerData = {
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
        }
        catch (error) {
            this.logger.error('Failed to create role picker:', error);
            return false;
        }
    }
    async addRoleToRolePicker(messageId, roleId, emoji, description) {
        try {
            const rolePicker = this.rolePickers.get(messageId);
            if (!rolePicker) {
                this.logger.warn(`Role picker not found: ${messageId}`);
                return false;
            }
            const channel = await this.bot.client.channels.fetch(rolePicker.channelId);
            const message = await channel.messages.fetch(messageId);
            const guild = channel.guild;
            const role = guild.roles.cache.get(roleId);
            if (!role) {
                this.logger.warn(`Role not found: ${roleId}`);
                return false;
            }
            rolePicker.roles.set(emoji, {
                roleId,
                roleName: role.name,
                description,
                emoji
            });
            try {
                await message.react(emoji);
            }
            catch (error) {
                this.logger.warn(`Failed to add reaction ${emoji}:`, error);
            }
            await this.updateRolePickerEmbed(message, rolePicker);
            this.logger.info(`Added role ${role.name} with emoji ${emoji} to role picker ${messageId}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to add role to role picker:', error);
            return false;
        }
    }
    async handleReactionRoleToggle(messageId, userId, emoji, added) {
        try {
            const rolePicker = this.rolePickers.get(messageId);
            if (!rolePicker)
                return;
            const roleData = rolePicker.roles.get(emoji);
            if (!roleData)
                return;
            const guild = this.bot.client.guilds.cache.first();
            if (!guild)
                return;
            const member = await guild.members.fetch(userId);
            const role = guild.roles.cache.get(roleData.roleId);
            if (!member || !role)
                return;
            if (added) {
                if (!member.roles.cache.has(role.id)) {
                    await member.roles.add(role, 'Role picker reaction');
                    await this.logRolePickerAction('add', member.user, role, 'reaction');
                }
            }
            else {
                if (member.roles.cache.has(role.id)) {
                    await member.roles.remove(role, 'Role picker reaction removed');
                    await this.logRolePickerAction('remove', member.user, role, 'reaction');
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to handle reaction role toggle:', error);
        }
    }
    async handleRoleSelection(interaction, params) {
        try {
            const errorEmbed = embed_1.EmbedManager.createInfoEmbed('Role Selection', 'Role selection via select menu is not yet implemented. Please use reaction-based role picking.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
        catch (error) {
            this.logger.error('Failed to handle role selection:', error);
        }
    }
    async updateRolePickerEmbed(message, rolePicker) {
        try {
            const updatedEmbed = embed_1.EmbedManager.createInfoEmbed(rolePicker.title, rolePicker.description);
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
        }
        catch (error) {
            this.logger.error('Failed to update role picker embed:', error);
        }
    }
    async logRolePickerAction(action, user, role, method) {
        try {
            if (!this.bot.channelManager)
                return;
            const logEmbed = embed_1.EmbedManager.createLogEmbed(`Role Picker ${action === 'add' ? 'Added' : 'Removed'}`, `${helpers_1.HelperUtils.formatUserTag(user)} ${action === 'add' ? 'gained' : 'lost'} role ${role.name} via ${method}`, [
                { name: 'Role', value: role.name, inline: true },
                { name: 'Method', value: method, inline: true },
                { name: 'User', value: helpers_1.HelperUtils.formatUserTag(user), inline: true }
            ]);
            await this.bot.channelManager.sendLog('modLogs', logEmbed);
        }
        catch (error) {
            this.logger.error('Failed to log role picker action:', error);
        }
    }
    getRolePickers() {
        return new Map(this.rolePickers);
    }
    isRolePickerMessage(messageId) {
        return this.rolePickers.has(messageId);
    }
}
exports.RolePickerManager = RolePickerManager;
//# sourceMappingURL=picker.js.map