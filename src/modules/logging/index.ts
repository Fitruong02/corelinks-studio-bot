// ===== src/modules/logging/index.ts =====
import { CorelinksBot } from '../../bot';
import { Message, User, VoiceState, GuildMember, Invite } from 'discord.js';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';
import { HelperUtils } from '@utils/helpers';
import { ChannelLogger } from './channels';
import { DiscordLogger } from './discord';

export class LoggingManager {
  private bot: CorelinksBot;
  private logger: Logger;
  private channelLogger: ChannelLogger;
  private discordLogger: DiscordLogger;
  private inviteCache: Map<string, Invite[]> = new Map(); // guildId -> invites

  constructor(bot: CorelinksBot) {
    this.bot = bot;
    this.logger = new Logger('LoggingManager');
    this.channelLogger = new ChannelLogger(bot);
    this.discordLogger = new DiscordLogger(bot);
    
    // Cache invites for tracking
    this.cacheInvites();
  }

  async logJoinLeave(member: GuildMember, type: 'join' | 'leave', inviteUsed?: Invite): Promise<void> {
    try {
      if (!this.bot.channelManager) return;

      if (type === 'join') {
        const joinEmbed = EmbedManager.createLogEmbed(
          '📥 Member Joined',
          `${HelperUtils.formatUserTag(member.user)} joined the server`,
          [
            { name: 'Account Created', value: HelperUtils.formatTimestamp(member.user.createdAt), inline: true },
            { name: 'Member Count', value: member.guild.memberCount.toString(), inline: true }
          ]
        );

        if (inviteUsed) {
          joinEmbed.addFields(
            { name: 'Invite Code', value: inviteUsed.code, inline: true },
            { name: 'Invited by', value: inviteUsed.inviter ? HelperUtils.formatUserTag(inviteUsed.inviter) : 'Unknown', inline: true },
            { name: 'Invite Uses', value: `${inviteUsed.uses}/${inviteUsed.maxUses || '∞'}`, inline: true }
          );
        }

        await this.bot.channelManager.sendLog('joinLeave', joinEmbed);

        // Update invite tracking
        if (inviteUsed) {
          await this.logInviteUse(inviteUsed);
        }

      } else {
        const leaveEmbed = EmbedManager.createLogEmbed(
          '📤 Member Left',
          `${HelperUtils.formatUserTag(member.user)} left the server`,
          [
            { name: 'Joined', value: member.joinedAt ? HelperUtils.formatTimestamp(member.joinedAt) : 'Unknown', inline: true },
            { name: 'Member Count', value: member.guild.memberCount.toString(), inline: true },
            { name: 'Roles', value: member.roles.cache.filter(role => role.name !== '@everyone').map(role => role.name).join(', ') || 'None', inline: false }
          ]
        );

        await this.bot.channelManager.sendLog('joinLeave', leaveEmbed);
      }

      this.logger.info(`Logged member ${type}: ${member.user.tag}`);

    } catch (error) {
      this.logger.error('Failed to log join/leave:', error);
    }
  }

  async logInviteUse(invite: Invite): Promise<void> {
    try {
      if (!this.bot.channelManager || !invite.inviter) return;

      const inviteEmbed = EmbedManager.createLogEmbed(
        '🔗 Invite Used',
        `Invite code \`${invite.code}\` was used`,
        [
          { name: 'Inviter', value: HelperUtils.formatUserTag(invite.inviter), inline: true },
          { name: 'Uses', value: `${invite.uses}/${invite.maxUses || '∞'}`, inline: true },
          { name: 'Channel', value: invite.channel?.name || 'Unknown', inline: true }
        ]
      );

      await this.bot.channelManager.sendLog('inviteLogs', inviteEmbed);

    } catch (error) {
      this.logger.error('Failed to log invite use:', error);
    }
  }

  async logMessageEdit(oldMessage: Message, newMessage: Message): Promise<void> {
    try {
    await this.discordLogger.logMessageEdit(oldMessage, newMessage);
    } catch (error) {
      this.logger.error('Failed to log message edit:', error);
    }
  }

  async logMessageDelete(message: Message): Promise<void> {
    try {
      await this.discordLogger.logMessageDelete(message);
    } catch (error) {
      this.logger.error('Failed to log message delete:', error);
    }
  }

  async logVoiceActivity(oldState: VoiceState, newState: VoiceState): Promise<void> {
    try {
      await this.discordLogger.logVoiceActivity(oldState, newState);
    } catch (error) {
      this.logger.error('Failed to log voice activity:', error);
    }
  }

  async logCommandUsage(commandName: string, user: User, channelId: string, guildId: string): Promise<void> {
    try {
      if (!this.bot.channelManager) return;

      const commandEmbed = EmbedManager.createLogEmbed(
        '🤖 Command Used',
        `${HelperUtils.formatUserTag(user)} used command \`/${commandName}\``,
        [
          { name: 'Command', value: `\`/${commandName}\``, inline: true },
          { name: 'Channel', value: `<#${channelId}>`, inline: true },
          { name: 'Timestamp', value: HelperUtils.formatTimestamp(new Date()), inline: true }
        ]
      );

      await this.bot.channelManager.sendLog('cmdLogs', commandEmbed);

    } catch (error) {
      this.logger.error('Failed to log command usage:', error);
    }
  }

  async logPaymentActivity(type: string, details: any): Promise<void> {
    try {
      if (!this.bot.channelManager) return;

      const paymentEmbed = EmbedManager.createLogEmbed(
        '💰 Payment Activity',
        `Payment ${type}`,
        [
          { name: 'Type', value: type, inline: true },
          { name: 'Timestamp', value: HelperUtils.formatTimestamp(new Date()), inline: true }
        ]
      );

      // Add details based on type
      if (details.invoiceId) {
        paymentEmbed.addFields({ name: 'Invoice ID', value: details.invoiceId, inline: true });
      }
      if (details.amount) {
        paymentEmbed.addFields({ name: 'Amount', value: `${details.amount.toLocaleString('vi-VN')} VND`, inline: true });
      }
      if (details.customerId) {
        paymentEmbed.addFields({ name: 'Customer', value: details.customerId, inline: true });
      }

      await this.bot.channelManager.sendLog('paymentLogs', paymentEmbed);

    } catch (error) {
      this.logger.error('Failed to log payment activity:', error);
    }
  }

  private async cacheInvites(): Promise<void> {
    try {
      const guild = this.bot.client.guilds.cache.first();
      if (!guild) return;

      const invites = await guild.invites.fetch();
      this.inviteCache.set(guild.id, Array.from(invites.values()));

      this.logger.info(`Cached ${invites.size} invites for guild ${guild.name}`);

    } catch (error) {
      this.logger.error('Failed to cache invites:', error);
    }
  }

  async detectInviteUsed(guildId: string): Promise<Invite | null> {
    try {
      const guild = this.bot.client.guilds.cache.get(guildId);
      if (!guild) return null;

      const newInvites = await guild.invites.fetch();
      const oldInvites = this.inviteCache.get(guildId) || [];

      for (const newInvite of newInvites.values()) {
        const oldInvite = oldInvites.find(inv => inv.code === newInvite.code);
        if (oldInvite && newInvite.uses && oldInvite.uses && newInvite.uses > oldInvite.uses) {
          // Update cache
          this.inviteCache.set(guildId, Array.from(newInvites.values()));
          return newInvite;
        }
      }

      // Update cache even if no invite was detected
      this.inviteCache.set(guildId, Array.from(newInvites.values()));
      return null;

    } catch (error) {
      this.logger.error('Failed to detect invite used:', error);
      return null;
    }
  }

  public getChannelLogger(): ChannelLogger {
    return this.channelLogger;
  }

  public getDiscordLogger(): DiscordLogger {
    return this.discordLogger;
  }
}
