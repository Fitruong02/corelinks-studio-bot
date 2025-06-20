// ===== src/modules/ticket/approval.ts =====
import { CorelinksBot } from '../../bot';
import { TicketData, TicketStatus, ServiceType } from '@types/ticket';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';
import { PermissionManager } from '@utils/permissions';
import { config } from '@config/config';

export class TicketApprovalManager {
  private bot: CorelinksBot;
  private logger: Logger;

  constructor(bot: CorelinksBot) {
    this.bot = bot;
    this.logger = new Logger('TicketApprovalManager');
  }

  async createApprovalMessage(ticket: TicketData, description: string): Promise<void> {
    try {
      if (!this.bot.channelManager) return;

      const approvalEmbed = EmbedManager.createTicketEmbed(
        ticket.ticketId,
        ticket.customerId,
        ticket.service
      );

      approvalEmbed.addFields(
        { name: 'Description', value: description || 'No description provided', inline: false },
        { name: 'Created', value: `<t:${Math.floor(ticket.createdAt.getTime() / 1000)}:F>`, inline: true },
        { name: 'Status', value: ticket.status.toUpperCase(), inline: true }
      );

      const actionRow = {
        type: 1,
        components: [
          {
            type: 2,
            style: 3, // Success (Green)
            label: 'Approve Ticket',
            customId: `ticket_approve_${ticket.ticketId}`,
            emoji: { name: '✅' }
          },
          {
            type: 2,
            style: 4, // Danger (Red)
            label: 'Reject Ticket',
            customId: `ticket_reject_${ticket.ticketId}`,
            emoji: { name: '❌' }
          },
          {
            type: 2,
            style: 1, // Primary (Blue)
            label: 'Assign to Me',
            customId: `ticket_assign_${ticket.ticketId}`,
            emoji: { name: '👤' }
          }
        ]
      };

      const serviceAssignRow = this.createServiceAssignmentRow(ticket);

      await this.bot.channelManager.sendLog('ticketRequests', {
        embeds: [approvalEmbed],
        components: [actionRow, serviceAssignRow]
      });

      this.logger.info(`Created approval message for ticket ${ticket.ticketId}`);
    } catch (error) {
      this.logger.error('Failed to create approval message:', error);
    }
  }

  private createServiceAssignmentRow(ticket: TicketData): any {
    const serviceStaffRoles = {
      [ServiceType.GAME]: config.roles.gameServiceStaff,
      [ServiceType.DISCORD]: config.roles.discordServiceStaff,
      [ServiceType.MINECRAFT]: config.roles.minecraftServiceStaff
    };

    return {
      type: 1,
      components: [
        {
          type: 3, // Select Menu
          customId: `ticket_assign_service_${ticket.ticketId}`,
          placeholder: `Assign to ${ticket.service} specialist`,
          options: [
            {
              label: `Auto-assign ${ticket.service} Staff`,
              value: `auto_${ticket.service.toLowerCase()}`,
              description: `Assign to available ${ticket.service} service staff`,
              emoji: { name: '🎯' }
            },
            {
              label: 'Manual Assignment',
              value: 'manual',
              description: 'Choose specific staff member',
              emoji: { name: '👥' }
            }
          ]
        }
      ]
    };
  }

  async handleApproval(ticketId: string, staffId: string): Promise<boolean> {
    try {
      // Import TicketManager to avoid circular dependency
      const { TicketManager } = await import('./index');
      const ticketManager = new TicketManager(this.bot);

      const success = await ticketManager.approveTicket(ticketId, staffId);

      if (success && this.bot.channelManager) {
        const approvalLogEmbed = EmbedManager.createSuccessEmbed(
          'Ticket Approved',
          `Ticket ${ticketId} has been approved by <@${staffId}>`
        );

        await this.bot.channelManager.sendLog('ticketLogs', approvalLogEmbed);
      }

      return success;
    } catch (error) {
      this.logger.error('Failed to handle approval:', error);
      return false;
    }
  }

  async handleRejection(ticketId: string, staffId: string, reason?: string): Promise<boolean> {
    try {
      // Get ticket data and notify customer
      const user = await this.getTicketUser(ticketId);
      if (user) {
        const rejectionEmbed = EmbedManager.createErrorEmbed(
          'Ticket Rejected',
          `Your ticket ${ticketId} has been rejected.\n\n**Reason:** ${reason || 'No reason provided'}\n\nYou can create a new ticket if you believe this was an error.`
        );

        await user.send({ embeds: [rejectionEmbed] });
      }

      // Log rejection
      if (this.bot.channelManager) {
        const rejectionLogEmbed = EmbedManager.createWarningEmbed(
          'Ticket Rejected',
          `Ticket ${ticketId} was rejected by <@${staffId}>`
        );

        rejectionLogEmbed.addFields({
          name: 'Reason',
          value: reason || 'No reason provided',
          inline: false
        });

        await this.bot.channelManager.sendLog('ticketLogs', rejectionLogEmbed);
      }

      this.logger.info(`Ticket ${ticketId} rejected by ${staffId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to handle rejection:', error);
      return false;
    }
  }

  async handleServiceAssignment(ticketId: string, assignmentType: string, staffId: string): Promise<boolean> {
    try {
      if (assignmentType.startsWith('auto_')) {
        const service = assignmentType.replace('auto_', '');
        return await this.autoAssignByService(ticketId, service as ServiceType, staffId);
      } else if (assignmentType === 'manual') {
        return await this.requestManualAssignment(ticketId, staffId);
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to handle service assignment:', error);
      return false;
    }
  }

  private async autoAssignByService(ticketId: string, service: ServiceType, requestedBy: string): Promise<boolean> {
    try {
      const guild = this.bot.client.guilds.cache.first();
      if (!guild) return false;

      const serviceRoleId = this.getServiceRoleId(service);
      if (!serviceRoleId) return false;

      // Find available staff with the service role
      const serviceRole = guild.roles.cache.get(serviceRoleId);
      if (!serviceRole) return false;

      const availableStaff = serviceRole.members.filter(member => 
        member.presence?.status === 'online' || member.presence?.status === 'idle'
      );

      if (availableStaff.size === 0) {
        // No online staff, assign to requestor or first available
        const assigneeId = requestedBy;
        const { TicketManager } = await import('./index');
        const ticketManager = new TicketManager(this.bot);
        return await ticketManager.assignTicket(ticketId, assigneeId, requestedBy);
      }

      // Assign to random available staff
      const randomStaff = availableStaff.random();
      const { TicketManager } = await import('./index');
      const ticketManager = new TicketManager(this.bot);
      
      return await ticketManager.assignTicket(ticketId, randomStaff.id, requestedBy);
    } catch (error) {
      this.logger.error('Failed to auto-assign by service:', error);
      return false;
    }
  }

  private async requestManualAssignment(ticketId: string, requestedBy: string): Promise<boolean> {
    try {
      if (!this.bot.channelManager) return false;

      const assignmentEmbed = EmbedManager.createInfoEmbed(
        'Manual Assignment Required',
        `<@${requestedBy}> has requested manual assignment for ticket ${ticketId}. Please use the ticket assignment command to assign this ticket to a specific staff member.`
      );

      await this.bot.channelManager.sendLog('ticketRequests', assignmentEmbed);
      return true;
    } catch (error) {
      this.logger.error('Failed to request manual assignment:', error);
      return false;
    }
  }

  private getServiceRoleId(service: ServiceType): string | null {
    switch (service) {
      case ServiceType.GAME:
        return config.roles.gameServiceStaff;
      case ServiceType.DISCORD:
        return config.roles.discordServiceStaff;
      case ServiceType.MINECRAFT:
        return config.roles.minecraftServiceStaff;
      default:
        return null;
    }
  }

  private async getTicketUser(ticketId: string): Promise<any | null> {
    // This would fetch ticket data and get user
    // Implementation depends on ticket storage strategy
    return null;
  }
}