// ===== src/modules/payment/invoice.ts =====
import { CorelinksBot } from '../../bot';
import { InvoiceData, PaymentMethod } from '../../types/payment';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';
import { ValidationManager } from '@utils/validation';
import { HelperUtils } from '@utils/helpers';

export class InvoiceManager {
  private bot: CorelinksBot;
  private logger: Logger;

  constructor(bot: CorelinksBot) {
    this.bot = bot;
    this.logger = new Logger('InvoiceManager');
  }

  async sendInvoiceToCustomer(invoice: InvoiceData): Promise<void> {
    try {
      const user = await this.bot.client.users.fetch(invoice.customerId);
      if (!user) {
        this.logger.warn(`User not found: ${invoice.customerId}`);
        return;
      }

      const finalAmount = invoice.isDeposit && invoice.depositAmount 
        ? invoice.depositAmount 
        : invoice.amount;

      const invoiceEmbed = EmbedManager.createPaymentEmbed(
        invoice.invoiceId,
        finalAmount,
        invoice.productName
      );

      invoiceEmbed.addFields(
        { name: 'Payment Type', value: invoice.isDeposit ? 'Deposit Payment' : 'Full Payment', inline: true },
        { name: 'Expires', value: HelperUtils.formatTimestamp(invoice.expiresAt), inline: true }
      );

      if (invoice.isDeposit && invoice.depositAmount) {
        const remainingAmount = invoice.amount - invoice.depositAmount;
        invoiceEmbed.addFields({
          name: 'Remaining Balance',
          value: ValidationManager.formatCurrency(remainingAmount),
          inline: true
        });
      }

      const paymentRow = {
        type: 1,
        components: [
          {
            type: 2,
            style: 5, // Link style
            label: 'Pay with Banking',
            url: invoice.paymentUrl,
            emoji: { name: '🏦' }
          },
          {
            type: 2,
            style: 1, // Primary style
            label: 'View QR Code',
            customId: `payment_qr_${invoice.invoiceId}`,
            emoji: { name: '📱' }
          }
        ]
      };

      const actionRow = {
        type: 1,
        components: [
          {
            type: 2,
            style: 2, // Secondary style
            label: 'View Details',
            customId: `payment_view_${invoice.invoiceId}`,
            emoji: { name: 'ℹ️' }
          },
          {
            type: 2,
            style: 4, // Danger style
            label: 'Request Refund',
            customId: `payment_refund_${invoice.invoiceId}`,
            emoji: { name: '💰' }
          }
        ]
      };

      await HelperUtils.safeDMSend(user, {
        embeds: [invoiceEmbed],
        components: [paymentRow, actionRow]
      });

      this.logger.info(`Sent invoice ${invoice.invoiceId} to customer ${invoice.customerId}`);

    } catch (error) {
      this.logger.error('Failed to send invoice to customer:', error);
    }
  }

  async showInvoiceDetails(interaction: any, invoiceId: string): Promise<void> {
    try {
      // This would fetch invoice data from storage
      // For now, we'll use a placeholder response
      
      const detailsEmbed = EmbedManager.createInfoEmbed(
        'Invoice Details',
        `Detailed information for invoice ${invoiceId}`
      );

      detailsEmbed.addFields(
        { name: 'Status', value: 'Pending', inline: true },
        { name: 'Created', value: HelperUtils.formatTimestamp(new Date()), inline: true },
        { name: 'Payment Method', value: 'Banking', inline: true }
      );

      await interaction.reply({ embeds: [detailsEmbed], ephemeral: true });

    } catch (error) {
      this.logger.error('Failed to show invoice details:', error);
      const errorEmbed = EmbedManager.createErrorEmbed(
        'Error',
        'Failed to retrieve invoice details.'
      );
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }

  async notifyPaymentSuccess(invoice: InvoiceData): Promise<void> {
    try {
      const user = await this.bot.client.users.fetch(invoice.customerId);
      if (!user) return;

      const finalAmount = invoice.isDeposit && invoice.depositAmount 
        ? invoice.depositAmount 
        : invoice.amount;

      const successEmbed = EmbedManager.createSuccessEmbed(
        'Payment Successful!',
        `Your payment for ${invoice.productName} has been processed successfully.`
      );

      successEmbed.addFields(
        { name: 'Invoice ID', value: invoice.invoiceId, inline: true },
        { name: 'Amount Paid', value: ValidationManager.formatCurrency(finalAmount), inline: true },
        { name: 'Processed At', value: HelperUtils.formatTimestamp(new Date()), inline: true }
      );

      if (invoice.isDeposit && invoice.depositAmount) {
        const remainingAmount = invoice.amount - invoice.depositAmount;
        successEmbed.addFields({
          name: 'Remaining Balance',
          value: `${ValidationManager.formatCurrency(remainingAmount)} (will be invoiced separately)`,
          inline: false
        });
      }

      successEmbed.setFooter({
        text: 'Thank you for your business! You now have Customer role access.'
      });

      await HelperUtils.safeDMSend(user, successEmbed);

    } catch (error) {
      this.logger.error('Failed to notify payment success:', error);
    }
  }

  async notifyPaymentCancellation(invoice: InvoiceData, reason: string): Promise<void> {
    try {
      const user = await this.bot.client.users.fetch(invoice.customerId);
      if (!user) return;

      const cancellationEmbed = EmbedManager.createWarningEmbed(
        'Payment Cancelled',
        `Your payment for ${invoice.productName} has been cancelled.`
      );

      cancellationEmbed.addFields(
        { name: 'Invoice ID', value: invoice.invoiceId, inline: true },
        { name: 'Reason', value: reason, inline: true },
        { name: 'Cancelled At', value: HelperUtils.formatTimestamp(new Date()), inline: true }
      );

      cancellationEmbed.setFooter({
        text: 'If you believe this was an error, please contact our support team.'
      });

      await HelperUtils.safeDMSend(user, cancellationEmbed);

    } catch (error) {
      this.logger.error('Failed to notify payment cancellation:', error);
    }
  }

  async sendPaymentReminder(invoice: InvoiceData): Promise<void> {
    try {
      const user = await this.bot.client.users.fetch(invoice.customerId);
      if (!user) return;

      const timeLeft = invoice.expiresAt.getTime() - Date.now();
      const minutesLeft = Math.floor(timeLeft / 60000);

      if (minutesLeft <= 15 && minutesLeft > 0) {
        const reminderEmbed = EmbedManager.createWarningEmbed(
          'Payment Reminder',
          `Your invoice ${invoice.invoiceId} will expire in ${minutesLeft} minutes.`
        );

        reminderEmbed.addFields({
          name: 'Quick Payment',
          value: `[Pay Now](${invoice.paymentUrl})`,
          inline: true
        });

        await HelperUtils.safeDMSend(user, reminderEmbed);
        this.logger.info(`Sent payment reminder for invoice ${invoice.invoiceId}`);
      }

    } catch (error) {
      this.logger.error('Failed to send payment reminder:', error);
    }
  }
}

export {};