// ===== src/modules/ticket/anonymous.ts =====
import { CorelinksBot } from '../../bot';
import { TicketData } from '../../types/ticket';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';
import { HelperUtils } from '@utils/helpers';
import { ValidationManager } from '@utils/validation';

export class AnonymousManager {
  private bot: CorelinksBot;
  private logger: Logger;
  private anonymousChannels: Map<string, string> = new Map(); // ticketId -> channelId
  private dmProxies: Map<string, string> = new Map(); // userId -> ticketId

  constructor(bot: CorelinksBot) {
    this.bot = bot;
    this.logger = new Logger('AnonymousManager');
  }

  async setupAnonymousChannel(ticket: TicketData, channelId: string): Promise<void> {
    try {
      this.anonymousChannels.set(ticket.ticketId, channelId);
      this.dmProxies.set(ticket.userId, ticket.ticketId);

      // Send initial instructions to customer via DM
      const user = await this.bot.client.users.fetch(ticket.userId);
      if (user) {
        const instructionEmbed = EmbedManager.createInfoEmbed(
          'Anonymous Communication Setup',
          `Your ticket ${ticket.ticketId} is now active. All messages you send here will be forwarded anonymously to our support team.\n\n**Important:**\n• Your identity remains hidden as ${ticket.customerId}\n• Only reply to this DM to communicate with support\n• Type "status" to check your ticket status\n• Type "close" to close your ticket`
        );

        await HelperUtils.safeDMSend(user, instructionEmbed);
      }

      this.logger.info(`Anonymous communication setup for ticket ${ticket.ticketId}`);
    } catch (error) {
      this.logger.error('Failed to setup anonymous channel:', error);
    }
  }

  async handleCustomerDM(message: any): Promise<void> {
    try {
      const userId = message.author.id;
      const ticketId = this.dmProxies.get(userId);

      if (!ticketId) {
        // Not in an active ticket
        return;
      }

      const content = message.content.toLowerCase().trim();

      // Handle special commands
      if (content === 'status') {
        await this.sendTicketStatus(message.author);
        return;
      }

      if (content === 'close') {
        await this.handleCustomerClose(ticketId, userId);
        return;
      }

      // Forward message to ticket channel
      await this.forwardMessageToStaff(ticketId, message);

    } catch (error) {
      this.logger.error('Error handling customer DM:', error);
    }
  }

  async handleStaffMessage(message: any, ticketId: string): Promise<void> {
    try {
      const ticket = await this.getTicketData(ticketId);
      if (!ticket) return;

      // Forward message to customer via DM
      await this.forwardMessageToCustomer(ticket, message);

    } catch (error) {
      this.logger.error('Error handling staff message:', error);
    }
  }

  private async forwardMessageToStaff(ticketId: string, customerMessage: any): Promise<void> {
    try {
      const channelId = this.anonymousChannels.get(ticketId);
      if (!channelId) return;

      const channel = await this.bot.client.channels.fetch(channelId);
      if (
        !channel ||
        !channel.isTextBased() ||
        channel.type === 3 // 3 is PartialGroupDMChannel in discord.js v14
      ) return;

      const ticket = await this.getTicketData(ticketId);
      if (!ticket) return;

      // Create anonymous message embed
      const messageEmbed = EmbedManager.createInfoEmbed(
        `Message from ${ticket.customerId}`,
        customerMessage.content
      );

      messageEmbed.setTimestamp(customerMessage.createdAt);

      // Handle attachments
      if (customerMessage.attachments.size > 0) {
        const attachmentUrls = Array.from(customerMessage.attachments.values())
          .map(attachment => {
            const att = attachment as { name: string; url: string };
            return `[${att.name}](${att.url})`;
          })
          .join('\n');
        
        messageEmbed.addFields({
          name: 'Attachments',
          value: attachmentUrls,
          inline: false
        });
      }

      // When sending on a channel, use a type guard
      if ('send' in channel && typeof channel.send === 'function') {
        await channel.send({ embeds: [messageEmbed] });
      }

      // Log the communication
      if (this.bot.channelManager) {
        const logEmbed = EmbedManager.createLogEmbed(
          'Anonymous Message',
          `Customer ${ticket.customerId} sent message in ticket ${ticketId}`,
          [
            { name: 'Message Length', value: customerMessage.content.length.toString(), inline: true },
            { name: 'Attachments', value: customerMessage.attachments.size.toString(), inline: true }
          ]
        );

        await this.bot.channelManager.sendLog('ticketLogs', logEmbed);
      }

    } catch (error) {
      this.logger.error('Failed to forward message to staff:', error);
    }
  }

  private async forwardMessageToCustomer(ticket: TicketData, staffMessage: any): Promise<void> {
    try {
      const user = await this.bot.client.users.fetch(ticket.userId);
      if (!user) return;

      const staffMember = await this.bot.client.users.fetch(staffMessage.author.id);
      
      const responseEmbed = EmbedManager.createInfoEmbed(
        `Response for Ticket ${ticket.ticketId}`,
        staffMessage.content
      );

      responseEmbed.setFooter({
        text: `Support Team Member • ${new Date().toLocaleString('vi-VN')}`,
        iconURL: staffMember?.displayAvatarURL()
      });

      // Handle attachments
      if (staffMessage.attachments.size > 0) {
        const attachmentUrls = Array.from(staffMessage.attachments.values())
          .map(attachment => {
            const att = attachment as { name: string; url: string };
            return `[${att.name}](${att.url})`;
          })
          .join('\n');
        
        responseEmbed.addFields({
          name: 'Files',
          value: attachmentUrls,
          inline: false
        });
      }

      await HelperUtils.safeDMSend(user, responseEmbed);

    } catch (error) {
      this.logger.error('Failed to forward message to customer:', error);
    }
  }

  private async sendTicketStatus(user: any): Promise<void> {
    try {
      const ticketId = this.dmProxies.get(user.id);
      if (!ticketId) return;

      const ticket = await this.getTicketData(ticketId);
      if (!ticket) return;

      const statusEmbed = EmbedManager.createInfoEmbed(
        'Ticket Status',
        `Here is the current status of your ticket:`
      );

      statusEmbed.addFields(
        { name: 'Ticket ID', value: ticket.ticketId, inline: true },
        { name: 'Customer ID', value: ticket.customerId, inline: true },
        { name: 'Service', value: ticket.service, inline: true },
        { name: 'Status', value: ticket.status.toUpperCase(), inline: true },
        { name: 'Created', value: HelperUtils.formatRelativeTime(ticket.createdAt), inline: true },
        { name: 'Last Activity', value: HelperUtils.formatRelativeTime(ticket.lastActivity), inline: true }
      );

      if (ticket.assignedStaff) {
        const staff = await this.bot.client.users.fetch(ticket.assignedStaff);
        statusEmbed.addFields({
          name: 'Assigned Staff',
          value: staff ? staff.username : 'Unknown',
          inline: true
        });
      }

      await HelperUtils.safeDMSend(user, statusEmbed);

    } catch (error) {
      this.logger.error('Failed to send ticket status:', error);
    }
  }

  private async handleCustomerClose(ticketId: string, userId: string): Promise<void> {
    try {
      // Import TicketManager to avoid circular dependency
      const { TicketManager } = await import('./index');
      const ticketManager = new TicketManager(this.bot);
      
      const closed = await ticketManager.closeTicket(ticketId, userId, 'Closed by customer');
      
      const user = await this.bot.client.users.fetch(userId);
      if (user) {
        if (closed) {
          const successEmbed = EmbedManager.createSuccessEmbed(
            'Ticket Closed',
            'Your ticket has been closed successfully. Thank you for using our support service!'
          );
          await HelperUtils.safeDMSend(user, successEmbed);
        } else {
          const errorEmbed = EmbedManager.createErrorEmbed(
            'Close Failed',
            'Failed to close your ticket. Please contact support directly.'
          );
          await HelperUtils.safeDMSend(user, errorEmbed);
        }
      }

      // Remove from tracking
      this.dmProxies.delete(userId);
      this.anonymousChannels.delete(ticketId);

    } catch (error) {
      this.logger.error('Failed to handle customer close:', error);
    }
  }

  private async getTicketData(ticketId: string): Promise<TicketData | null> {
    // This would typically fetch from database or active tickets
    // For now, we'll use a placeholder
    return null; // Implementation depends on ticket storage strategy
  }

  public removeAnonymousMapping(ticketId: string): void {
    const channelId = this.anonymousChannels.get(ticketId);
    this.anonymousChannels.delete(ticketId);

    // Find and remove user mapping
    for (const [userId, tId] of this.dmProxies.entries()) {
      if (tId === ticketId) {
        this.dmProxies.delete(userId);
        break;
      }
    }

    this.logger.info(`Removed anonymous mapping for ticket ${ticketId}`);
  }

  public isAnonymousChannel(channelId: string): boolean {
    return Array.from(this.anonymousChannels.values()).includes(channelId);
  }

  public getTicketFromChannel(channelId: string): string | null {
    for (const [ticketId, chId] of this.anonymousChannels.entries()) {
      if (chId === channelId) {
        return ticketId;
      }
    }
    return null;
  }
}