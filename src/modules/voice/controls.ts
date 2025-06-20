// ===== src/modules/voice/controls.ts =====
import { CorelinksBot } from '../../bot';
import { VoiceChannel, PermissionFlagsBits } from 'discord.js';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';
import { HelperUtils } from '@utils/helpers';
import { ValidationManager } from '@utils/validation';
import { VoiceManager } from './index';

export class VoiceControlManager {
  private bot: CorelinksBot;
  private logger: Logger;
  private voiceManager: VoiceManager;

  constructor(bot: CorelinksBot, voiceManager: VoiceManager) {
    this.bot = bot;
    this.logger = new Logger('VoiceControlManager');
    this.voiceManager = voiceManager;
  }

  async handleChannelControl(interaction: any, action: string, channelId: string): Promise<void> {
    try {
      const channel = await this.bot.client.channels.fetch(channelId) as VoiceChannel;
      if (!channel) {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'Channel Not Found',
          'The voice channel could not be found.'
        );
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
          const errorEmbed = EmbedManager.createErrorEmbed(
            'Unknown Action',
            'Unknown voice channel control action.'
          );
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    } catch (error) {
      this.logger.error('Error handling channel control:', error);
    }
  }

  private async handleRename(interaction: any, channel: VoiceChannel): Promise<void> {
    try {
      // This would typically show a modal for input
      // For now, we'll use a simplified approach
      const newName = `${interaction.user.username}'s Room`;
      
      await channel.setName(newName);
      
      const successEmbed = EmbedManager.createSuccessEmbed(
        'Channel Renamed',
        `Channel renamed to **${newName}**`
      );
      
      await interaction.reply({ embeds: [successEmbed], ephemeral: true });
      
      await this.logChannelAction(channel, interaction.user, 'renamed', `to "${newName}"`);
      
    } catch (error) {
      this.logger.error('Failed to rename channel:', error);
      const errorEmbed = EmbedManager.createErrorEmbed(
        'Rename Failed',
        'Failed to rename the voice channel.'
      );
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }

  private async handleLock(interaction: any, channel: VoiceChannel): Promise<void> {
    try {
      const tempData = this.voiceManager.getTempChannelData(channel.id);
      if (!tempData) return;

      if (tempData.isLocked) {
        const infoEmbed = EmbedManager.createInfoEmbed(
          'Already Locked',
          'This channel is already locked.'
        );
        await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
        return;
      }

      // Lock the channel (deny Connect for @everyone)
      await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
        Connect: false
      });

      this.voiceManager.updateTempChannelData(channel.id, { isLocked: true });

      const successEmbed = EmbedManager.createSuccessEmbed(
        'Channel Locked',
        'Channel has been locked. Only current members can stay.'
      );

      // Update control panel to show unlock option
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

    } catch (error) {
      this.logger.error('Failed to lock channel:', error);
    }
  }

  private async handleUnlock(interaction: any, channel: VoiceChannel): Promise<void> {
    try {
      const tempData = this.voiceManager.getTempChannelData(channel.id);
      if (!tempData) return;

      // Unlock the channel
      await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
        Connect: true
      });

      this.voiceManager.updateTempChannelData(channel.id, { isLocked: false });

      const successEmbed = EmbedManager.createSuccessEmbed(
        'Channel Unlocked',
        'Channel has been unlocked. Anyone can join now.'
      );

      await interaction.reply({ embeds: [successEmbed], ephemeral: true });
      await this.logChannelAction(channel, interaction.user, 'unlocked');

    } catch (error) {
      this.logger.error('Failed to unlock channel:', error);
    }
  }

  private async handleHide(interaction: any, channel: VoiceChannel): Promise<void> {
    try {
      const tempData = this.voiceManager.getTempChannelData(channel.id);
      if (!tempData) return;

      if (tempData.isHidden) {
        const infoEmbed = EmbedManager.createInfoEmbed(
          'Already Hidden',
          'This channel is already hidden.'
        );
        await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
        return;
      }

      // Hide the channel
      await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
        ViewChannel: false
      });

      this.voiceManager.updateTempChannelData(channel.id, { isHidden: true });

      const successEmbed = EmbedManager.createSuccessEmbed(
        'Channel Hidden',
        'Channel is now hidden from the channel list.'
      );

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

    } catch (error) {
      this.logger.error('Failed to hide channel:', error);
    }
  }

  private async handleShow(interaction: any, channel: VoiceChannel): Promise<void> {
    try {
      const tempData = this.voiceManager.getTempChannelData(channel.id);
      if (!tempData) return;

      // Show the channel
      await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
        ViewChannel: true
      });

      this.voiceManager.updateTempChannelData(channel.id, { isHidden: false });

      const successEmbed = EmbedManager.createSuccessEmbed(
        'Channel Visible',
        'Channel is now visible in the channel list.'
      );

      await interaction.reply({ embeds: [successEmbed], ephemeral: true });
      await this.logChannelAction(channel, interaction.user, 'shown');

    } catch (error) {
      this.logger.error('Failed to show channel:', error);
    }
  }

  private async handleLimit(interaction: any, channel: VoiceChannel): Promise<void> {
    try {
      // This would typically show options for user limit
      // For now, we'll cycle through common limits
      const currentLimit = channel.userLimit;
      const limits = [0, 2, 5, 10, 20]; // 0 = no limit
      const currentIndex = limits.indexOf(currentLimit);
      const newLimit = limits[(currentIndex + 1) % limits.length];

      await channel.setUserLimit(newLimit);

      this.voiceManager.updateTempChannelData(channel.id, { userLimit: newLimit });

      const limitText = newLimit === 0 ? 'No limit' : `${newLimit} users`;
      const successEmbed = EmbedManager.createSuccessEmbed(
        'User Limit Updated',
        `Channel user limit set to: **${limitText}**`
      );

      await interaction.reply({ embeds: [successEmbed], ephemeral: true });
      await this.logChannelAction(channel, interaction.user, 'limit changed', `to ${limitText}`);

    } catch (error) {
      this.logger.error('Failed to change user limit:', error);
    }
  }

  private async handleInvite(interaction: any, channel: VoiceChannel): Promise<void> {
    try {
      // This would typically show a user selection menu
      // For now, we'll provide instructions
      const inviteEmbed = EmbedManager.createInfoEmbed(
        'Invite Users',
        'To invite users to your channel:\n\n1. Right-click on the user\n2. Select "Invite to Voice Channel"\n3. Choose your channel\n\nOr you can move them directly if you have the permissions.'
      );

      // Create a temporary invite link
      const invite = await channel.createInvite({
        maxAge: 3600, // 1 hour
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

    } catch (error) {
      this.logger.error('Failed to create invite:', error);
    }
  }

  private async handleDelete(interaction: any, channel: VoiceChannel): Promise<void> {
    try {
      const confirmEmbed = EmbedManager.createWarningEmbed(
        'Delete Channel',
        'Are you sure you want to delete this voice channel? This action cannot be undone.'
      );

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

    } catch (error) {
      this.logger.error('Failed to show delete confirmation:', error);
    }
  }

  async handleDeleteConfirmation(interaction: any, channelId: string, confirmed: boolean): Promise<void> {
    try {
      if (confirmed) {
        const success = await this.voiceManager.deleteTempChannel(channelId, 'Deleted by owner');
        
        if (success) {
          const successEmbed = EmbedManager.createSuccessEmbed(
            'Channel Deleted',
            'Your voice channel has been deleted successfully.'
          );
          await interaction.update({ embeds: [successEmbed], components: [] });
        } else {
          const errorEmbed = EmbedManager.createErrorEmbed(
            'Delete Failed',
            'Failed to delete the voice channel.'
          );
          await interaction.update({ embeds: [errorEmbed], components: [] });
        }
      } else {
        const cancelEmbed = EmbedManager.createInfoEmbed(
          'Delete Cancelled',
          'Channel deletion has been cancelled.'
        );
        await interaction.update({ embeds: [cancelEmbed], components: [] });
      }
    } catch (error) {
      this.logger.error('Failed to handle delete confirmation:', error);
    }
  }

  private async logChannelAction(channel: VoiceChannel, user: any, action: string, details: string = ''): Promise<void> {
    try {
      if (!this.bot.channelManager) return;

      const logEmbed = EmbedManager.createLogEmbed(
        'Voice Channel Action',
        `${HelperUtils.formatUserTag(user)} ${action} voice channel ${details}`,
        [
          { name: 'Channel', value: channel.name, inline: true },
          { name: 'Action', value: action, inline: true },
          { name: 'User', value: HelperUtils.formatUserTag(user), inline: true }
        ]
      );

      await this.bot.channelManager.sendLog('voiceLogs', logEmbed);

    } catch (error) {
      this.logger.error('Failed to log channel action:', error);
    }
  }
}