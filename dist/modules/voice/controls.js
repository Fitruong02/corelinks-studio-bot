"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceControlManager = void 0;
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
const helpers_1 = require("@utils/helpers");
class VoiceControlManager {
    bot;
    logger;
    voiceManager;
    constructor(bot, voiceManager) {
        this.bot = bot;
        this.logger = new logger_1.Logger('VoiceControlManager');
        this.voiceManager = voiceManager;
    }
    async handleChannelControl(interaction, action, channelId) {
        try {
            const channel = await this.bot.client.channels.fetch(channelId);
            if (!channel) {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Channel Not Found', 'The voice channel could not be found.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }
            switch (action) {
                case 'rename':
                    await this.handleRename(interaction, channel);
                    break;
                case 'lock':
                    await this.handleLock(interaction, channel);
                    break;
                case 'unlock':
                    await this.handleUnlock(interaction, channel);
                    break;
                case 'hide':
                    await this.handleHide(interaction, channel);
                    break;
                case 'show':
                    await this.handleShow(interaction, channel);
                    break;
                case 'limit':
                    await this.handleLimit(interaction, channel);
                    break;
                case 'invite':
                    await this.handleInvite(interaction, channel);
                    break;
                case 'delete':
                    await this.handleDelete(interaction, channel);
                    break;
                default:
                    const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Unknown Action', 'Unknown voice channel control action.');
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
        catch (error) {
            this.logger.error('Error handling channel control:', error);
        }
    }
    async handleRename(interaction, channel) {
        try {
            const newName = `${interaction.user.username}'s Room`;
            await channel.setName(newName);
            const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Channel Renamed', `Channel renamed to **${newName}**`);
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
            await this.logChannelAction(channel, interaction.user, 'renamed', `to "${newName}"`);
        }
        catch (error) {
            this.logger.error('Failed to rename channel:', error);
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Rename Failed', 'Failed to rename the voice channel.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
    async handleLock(interaction, channel) {
        try {
            const tempData = this.voiceManager.getTempChannelData(channel.id);
            if (!tempData)
                return;
            if (tempData.isLocked) {
                const infoEmbed = embed_1.EmbedManager.createInfoEmbed('Already Locked', 'This channel is already locked.');
                await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
                return;
            }
            await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
                Connect: false
            });
            this.voiceManager.updateTempChannelData(channel.id, { isLocked: true });
            const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Channel Locked', 'Channel has been locked. Only current members can stay.');
            const unlockRow = {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 3,
                        label: 'Unlock Channel',
                        customId: `voice_unlock_${channel.id}`,
                        emoji: { name: '🔓' }
                    }
                ]
            };
            await interaction.reply({
                embeds: [successEmbed],
                components: [unlockRow],
                ephemeral: true
            });
            await this.logChannelAction(channel, interaction.user, 'locked');
        }
        catch (error) {
            this.logger.error('Failed to lock channel:', error);
        }
    }
    async handleUnlock(interaction, channel) {
        try {
            const tempData = this.voiceManager.getTempChannelData(channel.id);
            if (!tempData)
                return;
            await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
                Connect: true
            });
            this.voiceManager.updateTempChannelData(channel.id, { isLocked: false });
            const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Channel Unlocked', 'Channel has been unlocked. Anyone can join now.');
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
            await this.logChannelAction(channel, interaction.user, 'unlocked');
        }
        catch (error) {
            this.logger.error('Failed to unlock channel:', error);
        }
    }
    async handleHide(interaction, channel) {
        try {
            const tempData = this.voiceManager.getTempChannelData(channel.id);
            if (!tempData)
                return;
            if (tempData.isHidden) {
                const infoEmbed = embed_1.EmbedManager.createInfoEmbed('Already Hidden', 'This channel is already hidden.');
                await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
                return;
            }
            await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
                ViewChannel: false
            });
            this.voiceManager.updateTempChannelData(channel.id, { isHidden: true });
            const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Channel Hidden', 'Channel is now hidden from the channel list.');
            const showRow = {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 3,
                        label: 'Show Channel',
                        customId: `voice_show_${channel.id}`,
                        emoji: { name: '👁️' }
                    }
                ]
            };
            await interaction.reply({
                embeds: [successEmbed],
                components: [showRow],
                ephemeral: true
            });
            await this.logChannelAction(channel, interaction.user, 'hidden');
        }
        catch (error) {
            this.logger.error('Failed to hide channel:', error);
        }
    }
    async handleShow(interaction, channel) {
        try {
            const tempData = this.voiceManager.getTempChannelData(channel.id);
            if (!tempData)
                return;
            await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
                ViewChannel: true
            });
            this.voiceManager.updateTempChannelData(channel.id, { isHidden: false });
            const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Channel Visible', 'Channel is now visible in the channel list.');
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
            await this.logChannelAction(channel, interaction.user, 'shown');
        }
        catch (error) {
            this.logger.error('Failed to show channel:', error);
        }
    }
    async handleLimit(interaction, channel) {
        try {
            const currentLimit = channel.userLimit;
            const limits = [0, 2, 5, 10, 20];
            const currentIndex = limits.indexOf(currentLimit);
            const newLimit = limits[(currentIndex + 1) % limits.length];
            await channel.setUserLimit(newLimit);
            this.voiceManager.updateTempChannelData(channel.id, { userLimit: newLimit });
            const limitText = newLimit === 0 ? 'No limit' : `${newLimit} users`;
            const successEmbed = embed_1.EmbedManager.createSuccessEmbed('User Limit Updated', `Channel user limit set to: **${limitText}**`);
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
            await this.logChannelAction(channel, interaction.user, 'limit changed', `to ${limitText}`);
        }
        catch (error) {
            this.logger.error('Failed to change user limit:', error);
        }
    }
    async handleInvite(interaction, channel) {
        try {
            const inviteEmbed = embed_1.EmbedManager.createInfoEmbed('Invite Users', 'To invite users to your channel:\n\n1. Right-click on the user\n2. Select "Invite to Voice Channel"\n3. Choose your channel\n\nOr you can move them directly if you have the permissions.');
            const invite = await channel.createInvite({
                maxAge: 3600,
                maxUses: 10,
                unique: true
            });
            inviteEmbed.addFields({
                name: 'Invite Link',
                value: `[Click here to join](${invite.url})`,
                inline: false
            });
            await interaction.reply({ embeds: [inviteEmbed], ephemeral: true });
            await this.logChannelAction(channel, interaction.user, 'created invite');
        }
        catch (error) {
            this.logger.error('Failed to create invite:', error);
        }
    }
    async handleDelete(interaction, channel) {
        try {
            const confirmEmbed = embed_1.EmbedManager.createWarningEmbed('Delete Channel', 'Are you sure you want to delete this voice channel? This action cannot be undone.');
            const confirmRow = {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 4,
                        label: 'Yes, Delete',
                        customId: `voice_confirm_delete_${channel.id}`,
                        emoji: { name: '🗑️' }
                    },
                    {
                        type: 2,
                        style: 2,
                        label: 'Cancel',
                        customId: `voice_cancel_delete_${channel.id}`,
                        emoji: { name: '❌' }
                    }
                ]
            };
            await interaction.reply({
                embeds: [confirmEmbed],
                components: [confirmRow],
                ephemeral: true
            });
        }
        catch (error) {
            this.logger.error('Failed to show delete confirmation:', error);
        }
    }
    async handleDeleteConfirmation(interaction, channelId, confirmed) {
        try {
            if (confirmed) {
                const success = await this.voiceManager.deleteTempChannel(channelId, 'Deleted by owner');
                if (success) {
                    const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Channel Deleted', 'Your voice channel has been deleted successfully.');
                    await interaction.update({ embeds: [successEmbed], components: [] });
                }
                else {
                    const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Delete Failed', 'Failed to delete the voice channel.');
                    await interaction.update({ embeds: [errorEmbed], components: [] });
                }
            }
            else {
                const cancelEmbed = embed_1.EmbedManager.createInfoEmbed('Delete Cancelled', 'Channel deletion has been cancelled.');
                await interaction.update({ embeds: [cancelEmbed], components: [] });
            }
        }
        catch (error) {
            this.logger.error('Failed to handle delete confirmation:', error);
        }
    }
    async logChannelAction(channel, user, action, details = '') {
        try {
            if (!this.bot.channelManager)
                return;
            const logEmbed = embed_1.EmbedManager.createLogEmbed('Voice Channel Action', `${helpers_1.HelperUtils.formatUserTag(user)} ${action} voice channel ${details}`, [
                { name: 'Channel', value: channel.name, inline: true },
                { name: 'Action', value: action, inline: true },
                { name: 'User', value: helpers_1.HelperUtils.formatUserTag(user), inline: true }
            ]);
            await this.bot.channelManager.sendLog('voiceLogs', logEmbed);
        }
        catch (error) {
            this.logger.error('Failed to log channel action:', error);
        }
    }
}
exports.VoiceControlManager = VoiceControlManager;
//# sourceMappingURL=controls.js.map