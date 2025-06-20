// ===== src/modules/payment/refund.ts (UPDATED) =====
import { CorelinksBot } from '../../bot';
import { RefundRequest, RefundStatus, InvoiceData } from '../../types/payment';
import { BackupType } from '../../types/database';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';
import { PermissionManager } from '@utils/permissions';
import { HelperUtils } from '@utils/helpers';
import { ValidationManager } from '@utils/validation';
import { BackupModel } from '@database/models/Backup';
import { AnalyticsModel } from '@database/models/Analytics';

export class RefundManager {
  private bot: CorelinksBot;
  private logger: Logger;
  private activeRefunds: Map<string, RefundRequest> = new Map(); // invoiceId -> refundRequest

  constructor(bot: CorelinksBot) {
    this.bot = bot;
    this.logger = new Logger('RefundManager');
  }

  // Method called by PaymentManager.requestRefund()
  async createRefundRequest(invoiceId: string, customerId: string, reason: string): Promise<boolean> {
    try {
      // Check if refund already exists
      if (this.activeRefunds.has(invoiceId)) {
        this.logger.warn(`Refund already exists for invoice: ${invoiceId}`);
        return false;
      }

      const refundRequest: RefundRequest = {
        invoiceId,
        customerId,
        requestedBy: customerId,
        reason,
        amount: 0, // Will be filled when invoice data is available
        status: RefundStatus.REQUESTED,
        createdAt: new Date()
      };

      this.activeRefunds.set(invoiceId, refundRequest);

      // Send refund request to staff
      await this.sendRefundRequestToStaff(refundRequest);

      // Notify customer
      const user = await this.bot.client.users.fetch(customerId);
      if (user) {
        const confirmEmbed = EmbedManager.createInfoEmbed(
          'Refund Request Submitted',
          `Your refund request for invoice ${invoiceId} has been submitted and is under review.`
        );

        confirmEmbed.addFields({
          name: 'Reason',
          value: reason,
          inline: false
        });

        await HelperUtils.safeDMSend(user, confirmEmbed);
      }

      // Backup refund request
      await BackupModel.create(BackupType.PAYMENT_DATA, refundRequest);

      this.logger.info(`Created refund request for invoice ${invoiceId}`);
      return true;

    } catch (error) {
      this.logger.error('Failed to create refund request:', error);
      return false;
    }
  }

  // Method called by PaymentManager.processRefund()
  async processRefundRequest(invoiceId: string, staffId: string, approved: boolean, reason?: string): Promise<boolean> {
    try {
      const refundRequest = this.activeRefunds.get(invoiceId);
      if (!refundRequest) {
        this.logger.warn(`No refund request found for invoice: ${invoiceId}`);
        return false;
      }

      refundRequest.status = approved ? RefundStatus.APPROVED : RefundStatus.DENIED;
      refundRequest.processedAt = new Date();
      refundRequest.processedBy = staffId;

      if (approved) {
        // Process actual refund
        await this.executeRefund(refundRequest);
        
        // Update analytics (subtract from revenue)
        await AnalyticsModel.updateCurrentWeekRevenue(-refundRequest.amount);
        
        // Log as approved
        if (this.bot.channelManager) {
          const approvalEmbed = EmbedManager.createSuccessEmbed(
            'Refund Approved',
            `Refund request for invoice ${invoiceId} has been approved and processed.`
          );

          approvalEmbed.addFields(
            { name: 'Processed by', value: `<@${staffId}>`, inline: true },
            { name: 'Amount', value: ValidationManager.formatCurrency(refundRequest.amount), inline: true },
            { name: 'Customer', value: refundRequest.customerId, inline: true }
          );

          await this.bot.channelManager.sendLog('paymentLogs', approvalEmbed);
        }
      } else {
        // Log as denied
        if (this.bot.channelManager) {
          const denialEmbed = EmbedManager.createWarningEmbed(
            'Refund Denied',
            `Refund request for invoice ${invoiceId} has been denied.`
          );

          denialEmbed.addFields(
            { name: 'Denied by', value: `<@${staffId}>`, inline: true },
            { name: 'Reason', value: reason || 'No reason provided', inline: false }
          );

          await this.bot.channelManager.sendLog('paymentLogs', denialEmbed);
        }
      }

      // Notify customer
      await this.notifyRefundDecision(refundRequest, approved, reason);

      // Remove from active tracking if processed
      if (refundRequest.status === RefundStatus.APPROVED || refundRequest.status === RefundStatus.DENIED) {
        this.activeRefunds.delete(invoiceId);
      }

      // Backup updated refund request
      await BackupModel.create(BackupType.PAYMENT_DATA, refundRequest);

      this.logger.info(`Refund request for invoice ${invoiceId} ${approved ? 'approved' : 'denied'} by ${staffId}`);
      return true;

    } catch (error) {
      this.logger.error('Failed to process refund request:', error);
      return false;
    }
  }

  // Method called by PaymentManager.handleButtonInteraction() for staff
  async initiateStaffRefund(interaction: any, invoiceId: string): Promise<void> {
    try {
      if (!PermissionManager.isStaff(interaction.member)) {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'Permission Denied',
          'Only staff members can initiate refunds.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
      }

      const refundEmbed = EmbedManager.createInfoEmbed(
        'Staff Refund Initiation',
        `Do you want to create a refund for invoice ${invoiceId}?`
      );

      const confirmRow = {
        type: 1,
        components: [
          {
            type: 2,
            style: 3,
            label: 'Approve Refund',
            customId: `refund_approve_${invoiceId}`,
            emoji: { name: '✅' }
          },
          {
            type: 2,
            style: 4,
            label: 'Deny Refund',
            customId: `refund_deny_${invoiceId}`,
            emoji: { name: '❌' }
          }
        ]
      };

      await interaction.reply({
        embeds: [refundEmbed],
        components: [confirmRow],
        ephemeral: true
      });

    } catch (error) {
      this.logger.error('Failed to initiate staff refund:', error);
    }
  }

  // Method called by PaymentManager.handleButtonInteraction() for customers
  async initiateCustomerRefund(interaction: any, invoiceId: string): Promise<void> {
    try {
      // Check if customer already has a pending refund
      if (this.activeRefunds.has(invoiceId)) {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'Refund Already Requested',
          'A refund request for this invoice is already pending review.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
      }

      const refundEmbed = EmbedManager.createInfoEmbed(
        'Request Refund',
        'Please provide a reason for your refund request:'
      );

      // This would typically open a modal for reason input
      // For now, we'll use a simplified approach
      const defaultReason = 'Customer refund request via Discord';
      const success = await this.createRefundRequest(invoiceId, interaction.user.id, defaultReason);

      if (success) {
        const successEmbed = EmbedManager.createSuccessEmbed(
          'Refund Request Submitted',
          'Your refund request has been submitted for review. Our staff will process it shortly.'
        );
        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
      } else {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'Request Failed',
          'Failed to submit your refund request. Please try again later.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

    } catch (error) {
      this.logger.error('Failed to initiate customer refund:', error);
    }
  }

  private async sendRefundRequestToStaff(refundRequest: RefundRequest): Promise<void> {
    try {
      if (!this.bot.channelManager) return;

      const requestEmbed = EmbedManager.createWarningEmbed(
        'New Refund Request',
        `A refund has been requested for invoice ${refundRequest.invoiceId}`
      );

      requestEmbed.addFields(
        { name: 'Customer', value: refundRequest.customerId, inline: true },
        { name: 'Requested by', value: `<@${refundRequest.requestedBy}>`, inline: true },
        { name: 'Reason', value: refundRequest.reason, inline: false },
        { name: 'Requested at', value: HelperUtils.formatTimestamp(refundRequest.createdAt), inline: true }
      );

      const actionRow = {
        type: 1,
        components: [
          {
            type: 2,
            style: 3,
            label: 'Approve Refund',
            customId: `refund_approve_${refundRequest.invoiceId}`,
            emoji: { name: '✅' }
          },
          {
            type: 2,
            style: 4,
            label: 'Deny Refund',
            customId: `refund_deny_${refundRequest.invoiceId}`,
            emoji: { name: '❌' }
          },
          {
            type: 2,
            style: 2,
            label: 'View Invoice',
            customId: `payment_view_${refundRequest.invoiceId}`,
            emoji: { name: 'ℹ️' }
          }
        ]
      };

      await this.bot.channelManager.sendLog('paymentLogs', {
        embeds: [requestEmbed],
        components: [actionRow]
      });

    } catch (error) {
      this.logger.error('Failed to send refund request to staff:', error);
    }
  }

  private async executeRefund(refundRequest: RefundRequest): Promise<void> {
    try {
      // In a real implementation, this would integrate with PayOS API
      // to process the actual refund through the payment gateway
      
      refundRequest.status = RefundStatus.PROCESSED;
      refundRequest.processedAt = new Date();

      this.logger.info(`Executed refund for invoice ${refundRequest.invoiceId}`);

    } catch (error) {
      this.logger.error('Failed to execute refund:', error);
      throw error;
    }
  }

  private async notifyRefundDecision(refundRequest: RefundRequest, approved: boolean, reason?: string): Promise<void> {
    try {
      const user = await this.bot.client.users.fetch(refundRequest.customerId);
      if (!user) return;

      if (approved) {
        const approvalEmbed = EmbedManager.createSuccessEmbed(
          'Refund Approved',
          `Your refund request for invoice ${refundRequest.invoiceId} has been approved and processed.`
        );

        approvalEmbed.addFields(
          { name: 'Amount', value: ValidationManager.formatCurrency(refundRequest.amount), inline: true },
          { name: 'Processing Time', value: '3-5 business days', inline: true }
        );

        approvalEmbed.setFooter({
          text: 'The refund will appear in your original payment method.'
        });

        await HelperUtils.safeDMSend(user, approvalEmbed);
      } else {
        const denialEmbed = EmbedManager.createErrorEmbed(
          'Refund Denied',
          `Your refund request for invoice ${refundRequest.invoiceId} has been denied.`
        );

        denialEmbed.addFields({
          name: 'Reason',
          value: reason || 'No specific reason provided',
          inline: false
        });

        denialEmbed.setFooter({
          text: 'If you believe this decision was made in error, please contact our support team.'
        });

        await HelperUtils.safeDMSend(user, denialEmbed);
      }

    } catch (error) {
      this.logger.error('Failed to notify refund decision:', error);
    }
  }

  public getActiveRefunds(): RefundRequest[] {
    return Array.from(this.activeRefunds.values());
  }

  public getRefundByInvoice(invoiceId: string): RefundRequest | null {
    return this.activeRefunds.get(invoiceId) || null;
  }
}