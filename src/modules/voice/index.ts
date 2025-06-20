// ===== src/modules/voice/index.ts =====
import { CorelinksBot } from '../../bot';
import { VoiceState, VoiceChannel, ChannelType, PermissionFlagsBits } from 'discord.js';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';
import { PermissionManager } from '@utils/permissions';
import { HelperUtils } from '@utils/helpers';
import { config } from '@config/config';
import { TempChannelManager } from './tempChannels';
import { VoiceControlManager } from './controls';

export class VoiceManager {
  public bot: CorelinksBot;
  public logger: Logger;
  public tempChannelManager: TempChannelManager;
  public controlManager: VoiceControlManager;
  public tempChannels: Map<string, TempChannelData> = new Map(); // channelId -> data
  public channelOwners: Map<string, string> = new Map(); // channelId -> ownerId

  constructor(bot: CorelinksBot) {
    this.bot = bot;
    this.logger = new Logger('VoiceManager');
    this.tempChannelManager = new TempChannelManager(bot, this);
    this.controlManager = new VoiceControlManager(bot, this);

    // Start cleanup timer
    this.startCleanupTimer();
  }

  async handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<void> {
    try {
      // Handle temp channel creation
      if (newState.channelId === config.channels.voiceCreate) {
        await this.tempChannelManager.createTempChannel(newState.member!);
        return;
      }

      // Handle temp channel management
      if (oldState.channel && this.isTempChannel(oldState.channelId!)) {
        await this.tempChannelManager.handleUserLeave(oldState);
      }

      if (newState.channel && this.isTempChannel(newState.channelId!)) {
        await this.tempChannelManager.handleUserJoin(newState);
      }

      // Log voice activity
      await this.logVoiceActivity(oldState, newState);

    } catch (error) {
      this.logger.error('Error handling voice state update:', error);
    }
  }

  async handleButtonInteraction(interaction: any, params: string[]): Promise<void> {
    const [action, channelId] = params;

    try {
      const voiceChannel = interaction.member?.voice?.channel;
      if (!voiceChannel || voiceChannel.id !== channelId) {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'Not in Voice Channel',
          'You must be in the voice channel to control it.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
      }

      if (!this.canControlChannel(channelId, interaction.user.id)) {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'Permission Denied',
          'Only the channel owner or staff can control this channel.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
      }

      await this.controlManager.handleChannelControl(interaction, action, channelId);

    } catch (error) {
      this.logger.error('Error handling voice button interaction:', error);
      const errorEmbed = EmbedManager.createErrorEmbed(
        'Error',
        'An error occurred while processing your request.'
      );
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }

  async createTempChannel(owner: any, channelName?: string): Promise<VoiceChannel | null> {
    try {
      const guild = this.bot.client.guilds.cache.first();
      if (!guild) return null;

      const category = guild.channels.cache.get(config.channels.voiceTempCategory);
      const defaultName = `${owner.user.username}'s Room`;

      const tempChannel = await guild.channels.create({
        name: channelName || defaultName,
        type: ChannelType.GuildVoice,
        parent: category?.id,
        userLimit: 10,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
            deny: [PermissionFlagsBits.Speak]
          },
          {
            id: owner.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.MoveMembers
            ]
          }
        ]
      });

      // Register temp channel
      const tempChannelData: TempChannelData = {
        channelId: tempChannel.id,
        ownerId: owner.id,
        createdAt: new Date(),
        lastActivity: new Date(),
        isLocked: false,
        isHidden: false,
        userLimit: 10
      };

      this.tempChannels.set(tempChannel.id, tempChannelData);
      this.channelOwners.set(tempChannel.id, owner.id);

      // Move user to the new channel
      await owner.voice.setChannel(tempChannel);

      // Send control panel
      await this.sendChannelControlPanel(tempChannel, owner);

      // Log channel creation
      if (this.bot.channelManager) {
        const logEmbed = EmbedManager.createLogEmbed(
          'Temp Voice Channel Created',
          `${HelperUtils.formatUserTag(owner)} created a temporary voice channel`,
          [
            { name: 'Channel', value: tempChannel.name, inline: true },
            { name: 'Channel ID', value: tempChannel.id, inline: true }
          ]
        );

        await this.bot.channelManager.sendLog('voiceLogs', logEmbed);
      }

      this.logger.info(`Created temp voice channel: ${tempChannel.name} for ${owner.user.tag}`);
      return tempChannel;

    } catch (error) {
      this.logger.error('Failed to create temp channel:', error);
      return null;
    }
  }

  async deleteTempChannel(channelId: string, reason: string = 'Auto cleanup'): Promise<boolean> {
    try {
      const tempChannelData = this.tempChannels.get(channelId);
      if (!tempChannelData) return false;

      const channel = await this.bot.client.channels.fetch(channelId) as VoiceChannel;
      if (!channel) return false;

      // Log before deletion
      if (this.bot.channelManager) {
        const logEmbed = EmbedManager.createLogEmbed(
          'Temp Voice Channel Deleted',
          `Temporary voice channel deleted: ${channel.name}`,
          [
            { name: 'Reason', value: reason, inline: true },
            { name: 'Owner', value: `<@${tempChannelData.ownerId}>`, inline: true },
            { name: 'Duration', value: this.calculateChannelDuration(tempChannelData), inline: true }
          ]
        );

        await this.bot.channelManager.sendLog('voiceLogs', logEmbed);
      }

      // Delete the channel
      await channel.delete(reason);

      // Clean up tracking
      this.tempChannels.delete(channelId);
      this.channelOwners.delete(channelId);

      this.logger.info(`Deleted temp voice channel: ${channelId} (${reason})`);
      return true;

    } catch (error) {
      this.logger.error('Failed to delete temp channel:', error);
      return false;
    }
  }

  private async sendChannelControlPanel(channel: VoiceChannel, owner: any): Promise<void> {
    try {
      const controlEmbed = EmbedManager.createInfoEmbed(
        'Voice Channel Controls',
        `You are now the owner of **${channel.name}**. Use the buttons below to manage your channel.`
      );

      const controlRows = [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 2,
              label: 'Rename',
              customId: `voice_rename_${channel.id}`,
              emoji: { name: '✏️' }
            },
            {
              type: 2,
              style: 2,
              label: 'Lock',
              customId: `voice_lock_${channel.id}`,
              emoji: { name: '🔒' }
            },
            {
              type: 2,
              style: 2,
              label: 'Hide',
              customId: `voice_hide_${channel.id}`,
              emoji: { name: '👁️' }
            },
            {
              type: 2,
              style: 2,
              label: 'Limit',
              customId: `voice_limit_${channel.id}`,
              emoji: { name: '👥' }
            }
          ]
        },
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 1,
              label: 'Invite User',
              customId: `voice_invite_${channel.id}`,
              emoji: { name: '➕' }
            },
            {
              type: 2,
              style: 4,
              label: 'Delete Channel',
              customId: `voice_delete_${channel.id}`,
              emoji: { name: '🗑️' }
            }
          ]
        }
      ];

      await HelperUtils.safeDMSend(owner.user, {
        embeds: [controlEmbed],
        components: controlRows
      });

    } catch (error) {
      this.logger.error('Failed to send channel control panel:', error);
    }
  }

  private async logVoiceActivity(oldState: VoiceState, newState: VoiceState): Promise<void> {
    try {
      if (!this.bot.channelManager || !newState.member) return;

      const member = newState.member;
      let logMessage = '';
      let logFields: any[] = [];

      // User joined a voice channel
      if (!oldState.channel && newState.channel) {
        logMessage = `${HelperUtils.formatUserTag(member)} joined voice channel`;
        logFields.push({ name: 'Channel', value: newState.channel.name, inline: true });
      }
      // User left a voice channel
      else if (oldState.channel && !newState.channel) {
        logMessage = `${HelperUtils.formatUserTag(member)} left voice channel`;
        logFields.push({ name: 'Channel', value: oldState.channel.name, inline: true });
      }
      // User switched channels
      else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
        logMessage = `${HelperUtils.formatUserTag(member)} moved between voice channels`;
        logFields.push(
          { name: 'From', value: oldState.channel.name, inline: true },
          { name: 'To', value: newState.channel.name, inline: true }
        );
      }
      // User muted/unmuted
      else if (oldState.mute !== newState.mute) {
        logMessage = `${HelperUtils.formatUserTag(member)} ${newState.mute ? 'muted' : 'unmuted'} microphone`;
        if (newState.channel) {
          logFields.push({ name: 'Channel', value: newState.channel.name, inline: true });
        }
      }
      // User deafened/undeafened
      else if (oldState.deaf !== newState.deaf) {
        logMessage = `${HelperUtils.formatUserTag(member)} ${newState.deaf ? 'deafened' : 'undeafened'} audio`;
        if (newState.channel) {
          logFields.push({ name: 'Channel', value: newState.channel.name, inline: true });
        }
      }

      if (logMessage) {
        const embed = EmbedManager.createLogEmbed('Voice Activity', logMessage, logFields);
        await this.bot.channelManager.sendLog('voiceLogs', embed);
      }

      // Update last activity for temp channels
      if (newState.channel && this.isTempChannel(newState.channelId!)) {
        const tempData = this.tempChannels.get(newState.channelId!);
        if (tempData) {
          tempData.lastActivity = new Date();
        }
      }

    } catch (error) {
      this.logger.error('Failed to log voice activity:', error);
    }
  }

  private startCleanupTimer(): void {
    setInterval(async () => {
      await this.cleanupInactiveChannels();
    }, 60000); // Check every minute
  }

  private async cleanupInactiveChannels(): Promise<void> {
    const now = new Date();
    const inactiveMinutes = config.settings.voiceInactiveMinutes;

    for (const [channelId, tempData] of this.tempChannels.entries()) {
      try {
        const channel = await this.bot.client.channels.fetch(channelId) as VoiceChannel;
        if (!channel || channel.members.size === 0) {
          const minutesSinceActivity = (now.getTime() - tempData.lastActivity.getTime()) / 60000;
          
          if (minutesSinceActivity >= inactiveMinutes) {
            await this.deleteTempChannel(channelId, 'Inactive for too long');
          }
        } else {
          // Update last activity if channel has members
          tempData.lastActivity = now;
        }
      } catch (error) {
        // Channel might have been deleted, remove from tracking
        this.tempChannels.delete(channelId);
        this.channelOwners.delete(channelId);
      }
    }
  }

  private calculateChannelDuration(tempData: TempChannelData): string {
    const duration = Date.now() - tempData.createdAt.getTime();
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }

  // Public methods for other components
  public isTempChannel(channelId: string): boolean {
    return this.tempChannels.has(channelId);
  }

  public canControlChannel(channelId: string, userId: string): boolean {
    const ownerId = this.channelOwners.get(channelId);
    return ownerId === userId || PermissionManager.isStaff(
      this.bot.client.guilds.cache.first()?.members.cache.get(userId) as any
    );
  }

  public getTempChannelData(channelId: string): TempChannelData | null {
    return this.tempChannels.get(channelId) || null;
  }

  public updateTempChannelData(channelId: string, updates: Partial<TempChannelData>): void {
    const tempData = this.tempChannels.get(channelId);
    if (tempData) {
      Object.assign(tempData, updates);
    }
  }

  public getActiveTempChannels(): TempChannelData[] {
    return Array.from(this.tempChannels.values());
  }
}

interface TempChannelData {
  channelId: string;
  ownerId: string;
  createdAt: Date;
  lastActivity: Date;
  isLocked: boolean;
  isHidden: boolean;
  userLimit: number;
}