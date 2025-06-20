// ===== src/modules/ticket/index.ts =====
import { CorelinksBot } from '../../bot';
import { TicketData, ServiceType, TicketStatus, TicketPriority } from '../../types/ticket';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';
import { ValidationManager } from '@utils/validation';
import { HelperUtils } from '@utils/helpers';
import { PermissionManager } from '@utils/permissions';
import { BackupModel } from '@database/models/Backup';
import { BackupType } from '../../types/database';
import { AnonymousManager } from './anonymous';
import { TicketRatingManager } from './rating';

export class TicketManager {
  private bot: CorelinksBot;
  private logger: Logger;
  private activeTickets: Map<string, TicketData> = new Map();
  private userTickets: Map<string, string> = new Map(); // userId -> ticketId
  private anonymousManager: AnonymousManager;
  private ratingManager: TicketRatingManager;

  constructor(bot: CorelinksBot) {
    this.bot = bot;
    this.logger = new Logger('TicketManager');
    this.anonymousManager = new AnonymousManager(bot);
    this.ratingManager = new TicketRatingManager(bot);
    
    // Auto-close inactive tickets
    this.startAutoCloseTimer();
  }

  async createTicketRequest(userId: string, username: string, service: ServiceType, description: string): Promise<boolean> {
    try {
      // Check if user already has an open ticket
      if (this.userTickets.has(userId)) {
        return false;
      }

      const ticketId = ValidationManager.generateTicketId();
      const customerId = ValidationManager.generateCustomerId();

      const ticketData: TicketData = {
        ticketId,
        customerId,
        userId,
        username,
        service,
        status: TicketStatus.PENDING,
        priority: TicketPriority.MEDIUM,
        createdAt: new Date(),
        lastActivity: new Date()
      };

      // Store ticket data
      this.activeTickets.set(ticketId, ticketData);
      this.userTickets.set(userId, ticketId);

      // Send ticket request to staff channel
      await this.sendTicketRequest(ticketData, description);

      // Backup ticket data
      await BackupModel.create(BackupType.TICKET_DATA, ticketData);

      this.logger.info(`Created ticket request: ${ticketId} for user ${username}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to create ticket request:', error);
      return false;
    }
  }

  async approveTicket(ticketId: string, staffId: string): Promise<boolean> {
    try {
      const ticket = this.activeTickets.get(ticketId);
      if (!ticket || ticket.status !== TicketStatus.PENDING) {
        return false;
      }

      // Create private ticket channel
      const guild = this.bot.client.guilds.cache.get(this.bot.client.guilds.cache.first()?.id || '');
      if (!guild) return false;

      const ticketChannel = await guild.channels.create({
        name: `ticket-${ticket.customerId.toLowerCase()}`,
        parent: guild.channels.cache.find(c => c.name === 'TICKETS')?.id,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: ['ViewChannel']
          },
          {
            id: staffId,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
          }
        ]
      });

      // Update ticket status
      ticket.status = TicketStatus.APPROVED;
      ticket.assignedStaff = staffId;
      ticket.channelId = ticketChannel.id;
      ticket.lastActivity = new Date();

      // Setup anonymous communication
      await this.anonymousManager.setupAnonymousChannel(ticket, ticketChannel.id);

      // Send welcome message to ticket channel
      const welcomeEmbed = EmbedManager.createTicketEmbed(
        ticket.ticketId,
        ticket.customerId,
        ticket.service
      );
      
      await ticketChannel.send({
        embeds: [welcomeEmbed],
        content: `<@${staffId}> - Ticket được phê duyệt. Khách hàng sẽ được thông báo qua DM.`
      });

      // Notify customer via DM
      const user = await this.bot.client.users.fetch(ticket.userId);
      if (user) {
        const dmEmbed = EmbedManager.createSuccessEmbed(
          'Ticket Approved',
          `Your ticket ${ticket.ticketId} has been approved. You can now communicate with our support team. Simply reply to this message to chat.`
        );
        
        await HelperUtils.safeDMSend(user, dmEmbed);
      }

      // Log ticket approval
      if (this.bot.channelManager) {
        const logEmbed = EmbedManager.createLogEmbed(
          'Ticket Approved',
          `Ticket ${ticket.ticketId} approved by <@${staffId}>`,
          [
            { name: 'Customer ID', value: ticket.customerId, inline: true },
            { name: 'Service', value: ticket.service, inline: true },
            { name: 'Channel', value: `<#${ticketChannel.id}>`, inline: true }
          ]
        );
        
        await this.bot.channelManager.sendLog('ticketLogs', logEmbed);
      }

      this.logger.info(`Ticket ${ticketId} approved by staff ${staffId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to approve ticket:', error);
      return false;
    }
  }

  async closeTicket(ticketId: string, closedBy: string, reason?: string): Promise<boolean> {
    try {
      const ticket = this.activeTickets.get(ticketId);
      if (!ticket) return false;

      // Update ticket status
      ticket.status = TicketStatus.CLOSED;
      ticket.closedAt = new Date();

      // Archive ticket channel if exists
      if (ticket.channelId) {
        const channel = await this.bot.client.channels.fetch(ticket.channelId);
        if (
          channel &&
          channel.isTextBased() &&
          ('send' in channel) &&
          typeof channel.send === 'function'
        ) {
          // Only edit the name if the channel supports it
          if (
            channel.type === 0 || // TextChannel
            channel.type === 5 || // NewsChannel
            channel.type === 11 || // PublicThreadChannel
            channel.type === 12    // PrivateThreadChannel
          ) {
            await (channel as any).edit({ name: `closed-${ticket.customerId.toLowerCase()}` });
          }
          
          const closeEmbed = EmbedManager.createInfoEmbed(
            'Ticket Closed',
            `This ticket has been closed. Reason: ${reason || 'No reason provided'}`
          );
          
          await channel.send({ embeds: [closeEmbed] });
        }
      }

      // Remove from active tracking
      this.activeTickets.delete(ticketId);
      this.userTickets.delete(ticket.userId);

      // Send rating request to customer
      await this.ratingManager.requestRating(ticket);

      // Log ticket closure
      if (this.bot.channelManager) {
        const logEmbed = EmbedManager.createLogEmbed(
          'Ticket Closed',
          `Ticket ${ticket.ticketId} closed`,
          [
            { name: 'Closed By', value: `<@${closedBy}>`, inline: true },
            { name: 'Reason', value: reason || 'No reason provided', inline: true },
            { name: 'Duration', value: this.calculateTicketDuration(ticket), inline: true }
          ]
        );
        
        await this.bot.channelManager.sendLog('ticketLogs', logEmbed);
      }

      // Backup closed ticket data
      await BackupModel.create(BackupType.TICKET_DATA, ticket);

      this.logger.info(`Ticket ${ticketId} closed by ${closedBy}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to close ticket:', error);
      return false;
    }
  }

  async setTicketPriority(ticketId: string, priority: TicketPriority, staffId: string): Promise<boolean> {
    try {
      const ticket = this.activeTickets.get(ticketId);
      if (!ticket) return false;

      const oldPriority = ticket.priority;
      ticket.priority = priority;
      ticket.lastActivity = new Date();

      // Log priority change
      if (this.bot.channelManager) {
        const logEmbed = EmbedManager.createLogEmbed(
          'Ticket Priority Updated',
          `Ticket ${ticketId} priority changed from ${oldPriority} to ${priority}`,
          [
            { name: 'Updated By', value: `<@${staffId}>`, inline: true },
            { name: 'Customer ID', value: ticket.customerId, inline: true }
          ]
        );
        
        await this.bot.channelManager.sendLog('ticketLogs', logEmbed);
      }

      this.logger.info(`Ticket ${ticketId} priority updated to ${priority} by ${staffId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to set ticket priority:', error);
      return false;
    }
  }

  async assignTicket(ticketId: string, staffId: string, assignedBy: string): Promise<boolean> {
    try {
      const ticket = this.activeTickets.get(ticketId);
      if (!ticket) return false;

      const oldStaff = ticket.assignedStaff;
      ticket.assignedStaff = staffId;
      ticket.lastActivity = new Date();

      // Update channel permissions if ticket has a channel
      if (ticket.channelId) {
        const channel = await this.bot.client.channels.fetch(ticket.channelId);
        if (channel && 'permissionOverwrites' in channel) {
          // Remove old staff permissions if any
          if (oldStaff) {
            await channel.permissionOverwrites.delete(oldStaff);
          }
          
          // Add new staff permissions
          await channel.permissionOverwrites.create(staffId, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
          });
        }
      }

      // Log assignment change
      if (this.bot.channelManager) {
        const logEmbed = EmbedManager.createLogEmbed(
          'Ticket Assignment Updated',
          `Ticket ${ticketId} assigned to <@${staffId}>`,
          [
            { name: 'Assigned By', value: `<@${assignedBy}>`, inline: true },
            { name: 'Previous Staff', value: oldStaff ? `<@${oldStaff}>` : 'None', inline: true },
            { name: 'Customer ID', value: ticket.customerId, inline: true }
          ]
        );
        
        await this.bot.channelManager.sendLog('ticketLogs', logEmbed);
      }

      this.logger.info(`Ticket ${ticketId} assigned to ${staffId} by ${assignedBy}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to assign ticket:', error);
      return false;
    }
  }

  async getTicketStatus(userId: string): Promise<TicketData | null> {
    const ticketId = this.userTickets.get(userId);
    if (!ticketId) return null;
    
    return this.activeTickets.get(ticketId) || null;
  }

  async handleButtonInteraction(interaction: any, params: string[]): Promise<void> {
    const [action, ticketId] = params;
    
    try {
      if (!interaction.member || !PermissionManager.isStaff(interaction.member)) {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'Permission Denied',
          'Only staff members can perform this action.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
      }

      switch (action) {
        case 'approve':
          const approved = await this.approveTicket(ticketId, interaction.user.id);
          if (approved) {
            const successEmbed = EmbedManager.createSuccessEmbed(
              'Ticket Approved',
              `Ticket ${ticketId} has been approved and a private channel has been created.`
            );
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
          } else {
            const errorEmbed = EmbedManager.createErrorEmbed(
              'Approval Failed',
              'Failed to approve this ticket. It may have already been processed.'
            );
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
          }
          break;

        case 'close':
          const closed = await this.closeTicket(ticketId, interaction.user.id, 'Closed by staff');
          if (closed) {
            const successEmbed = EmbedManager.createSuccessEmbed(
              'Ticket Closed',
              `Ticket ${ticketId} has been closed successfully.`
            );
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
          } else {
            const errorEmbed = EmbedManager.createErrorEmbed(
              'Close Failed',
              'Failed to close this ticket.'
            );
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
          }
          break;

        default:
          const errorEmbed = EmbedManager.createErrorEmbed(
            'Unknown Action',
            'Unknown button action.'
          );
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    } catch (error) {
      this.logger.error('Error handling ticket button interaction:', error);
      const errorEmbed = EmbedManager.createErrorEmbed(
        'Error',
        'An error occurred while processing your request.'
      );
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }

  async handleServiceSelection(interaction: any, params: string[]): Promise<void> {
    try {
      const selectedService = interaction.values[0] as ServiceType;
      const userId = interaction.user.id;
      const username = interaction.user.username;

      // Check if user already has a ticket
      if (this.userTickets.has(userId)) {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'Active Ticket Exists',
          'You already have an active ticket. Please wait for it to be resolved before creating a new one.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
      }

      const created = await this.createTicketRequest(userId, username, selectedService, 'Service requested via dropdown');
      
      if (created) {
        const successEmbed = EmbedManager.createSuccessEmbed(
          'Ticket Created',
          `Your ticket request for ${selectedService} has been submitted. Our staff will review it shortly.`
        );
        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
      } else {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'Creation Failed',
          'Failed to create your ticket request. Please try again later.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    } catch (error) {
      this.logger.error('Error handling service selection:', error);
      const errorEmbed = EmbedManager.createErrorEmbed(
        'Error',
        'An error occurred while processing your selection.'
      );
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }

  private async sendTicketRequest(ticket: TicketData, description: string): Promise<void> {
    if (!this.bot.channelManager) return;

    const requestEmbed = EmbedManager.createTicketEmbed(
      ticket.ticketId,
      ticket.customerId,
      ticket.service
    );

    requestEmbed.addFields(
      { name: 'Description', value: ValidationManager.truncateText(description, 1000), inline: false },
      { name: 'Created', value: HelperUtils.formatTimestamp(ticket.createdAt), inline: true },
      { name: 'Priority', value: ticket.priority.toUpperCase(), inline: true }
    );

    const row = {
      type: 1,
      components: [
        {
          type: 2,
          style: 3,
          label: 'Approve',
          customId: `ticket_approve_${ticket.ticketId}`
        },
        {
          type: 2,
          style: 4,
          label: 'Reject',
          customId: `ticket_reject_${ticket.ticketId}`
        }
      ]
    };

    await this.bot.channelManager.sendLog('ticketRequests', {
      embeds: [requestEmbed],
      components: [row]
    });
  }

  private startAutoCloseTimer(): void {
    setInterval(async () => {
      await this.checkInactiveTickets();
    }, 3600000); // Check every hour
  }

  private async checkInactiveTickets(): Promise<void> {
    const now = new Date();
    const autoCloseDays = 7; // From config

    for (const [ticketId, ticket] of this.activeTickets.entries()) {
      if (ticket.status === TicketStatus.ACTIVE || ticket.status === TicketStatus.WAITING) {
        const daysSinceActivity = (now.getTime() - ticket.lastActivity.getTime()) / (1000 * 3600 * 24);
        
        if (daysSinceActivity >= autoCloseDays) {
          await this.closeTicket(ticketId, 'system', 'Auto-closed due to inactivity');
        }
      }
    }
  }

  private calculateTicketDuration(ticket: TicketData): string {
    const start = ticket.createdAt;
    const end = ticket.closedAt || new Date();
    const duration = end.getTime() - start.getTime();
    
    const days = Math.floor(duration / (1000 * 3600 * 24));
    const hours = Math.floor((duration % (1000 * 3600 * 24)) / (1000 * 3600));
    const minutes = Math.floor((duration % (1000 * 3600)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  // Public getters for analytics
  public getActiveTicketsCount(): number {
    return this.activeTickets.size;
  }

  public getTicketsByStatus(status: TicketStatus): TicketData[] {
    return Array.from(this.activeTickets.values()).filter(ticket => ticket.status === status);
  }

  public getAllActiveTickets(): TicketData[] {
    return Array.from(this.activeTickets.values());
  }
}