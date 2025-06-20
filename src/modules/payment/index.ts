// ===== src/modules/payment/index.ts =====
import { CorelinksBot } from '../../bot';
import { InvoiceData, PaymentMethod, PaymentStatus, RefundRequest } from '../../types/payment';
import { BackupType } from '../../types/database';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';
import { ValidationManager } from '@utils/validation';
import { PermissionManager } from '@utils/permissions';
import { HelperUtils } from '@utils/helpers';
import { BackupModel } from '@database/models/Backup';
import { AnalyticsModel } from '@database/models/Analytics';
import { PayOSManager } from './payos';
import { InvoiceManager } from './invoice';
import { RefundManager } from './refund';

export class PaymentManager {
  private bot: CorelinksBot;
  private logger: Logger;
  private activeInvoices: Map<string, InvoiceData> = new Map();
  private payosManager: PayOSManager;
  private invoiceManager: InvoiceManager;
  private refundManager: RefundManager;

  constructor(bot: CorelinksBot) {
    this.bot = bot;
    this.logger = new Logger('PaymentManager');
    this.payosManager = new PayOSManager(bot);
    this.invoiceManager = new InvoiceManager(bot);
    this.refundManager = new RefundManager(bot); // RefundManager now requires a CorelinksBot argument

    // Check for expired invoices every hour
    this.startExpirationTimer();
  }

  async createInvoice(
    staffId: string,
    customerId: string,
    productName: string,
    amount: number,
    isDeposit: boolean = false,
    depositAmount?: number,
    ticketId?: string
  ): Promise<InvoiceData | null> {
    try {
      if (!ValidationManager.isValidAmount(amount)) {
        this.logger.warn(`Invalid amount: ${amount}`);
        return null;
      }

      const invoiceId = ValidationManager.generateInvoiceId();
      const finalAmount = isDeposit && depositAmount ? depositAmount : amount;

      const invoiceData: InvoiceData = {
        invoiceId,
        ticketId,
        customerId,
        staffId,
        productName,
        amount,
        depositAmount,
        isDeposit,
        paymentMethod: PaymentMethod.BANKING, // Default, user will choose
        status: PaymentStatus.PENDING,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        createdAt: new Date()
      };

      // Store invoice
      this.activeInvoices.set(invoiceId, invoiceData);

      // Create payment link via PayOS
      const paymentResult = await this.payosManager.createPaymentLink(invoiceData);
      if (!paymentResult) {
        this.activeInvoices.delete(invoiceId);
        return null;
      }

      // Update invoice with payment data
      invoiceData.payosOrderId = paymentResult.orderCode;
      invoiceData.paymentUrl = paymentResult.checkoutUrl;
      invoiceData.qrCode = paymentResult.qrCode;

      // Send invoice to customer
      await this.invoiceManager.sendInvoiceToCustomer(invoiceData);

      // Log invoice creation
      if (this.bot.channelManager) {
        const logEmbed = EmbedManager.createPaymentEmbed(
          invoiceData.invoiceId,
          finalAmount,
          productName
        );

        logEmbed.addFields(
          { name: 'Created by', value: `<@${staffId}>`, inline: true },
          { name: 'Customer', value: customerId, inline: true },
          { name: 'Type', value: isDeposit ? 'Deposit' : 'Full Payment', inline: true }
        );

        await this.bot.channelManager.sendLog('paymentLogs', logEmbed);
      }

      // Backup invoice data
      await BackupModel.create(BackupType.PAYMENT_DATA, invoiceData);

      this.logger.info(`Created invoice ${invoiceId} for ${finalAmount} VND`);
      return invoiceData;

    } catch (error) {
      this.logger.error('Failed to create invoice:', error);
      return null;
    }
  }

  async processPaymentWebhook(webhookData: any): Promise<void> {
    try {
      const orderCode = webhookData.orderCode;
      const status = webhookData.status;

      // Find invoice by PayOS order code
      const invoice = Array.from(this.activeInvoices.values())
        .find(inv => inv.payosOrderId === orderCode.toString());

      if (!invoice) {
        this.logger.warn(`No invoice found for order code: ${orderCode}`);
        return;
      }

      if (status === 'PAID') {
        await this.completePayment(invoice.invoiceId);
      } else if (status === 'CANCELLED') {
        await this.cancelPayment(invoice.invoiceId, 'Payment cancelled by user');
      }

    } catch (error) {
      this.logger.error('Failed to process payment webhook:', error);
    }
  }

  async completePayment(invoiceId: string): Promise<boolean> {
    try {
      const invoice = this.activeInvoices.get(invoiceId);
      if (!invoice || invoice.status !== PaymentStatus.PENDING) {
        return false;
      }

      // Update invoice status
      invoice.status = PaymentStatus.PAID;
      invoice.paidAt = new Date();

      // Grant customer role
      const guild = this.bot.client.guilds.cache.first();
      if (guild) {
        const member = await guild.members.fetch(invoice.customerId);
        if (member) {
          await PermissionManager.grantCustomerRole(member);
        }
      }

      // Update analytics
      const finalAmount = invoice.isDeposit && invoice.depositAmount 
        ? invoice.depositAmount 
        : invoice.amount;
      await AnalyticsModel.updateCurrentWeekRevenue(finalAmount);

      // Notify customer
      await this.invoiceManager.notifyPaymentSuccess(invoice);

      // Log payment completion
      if (this.bot.channelManager) {
        const successEmbed = EmbedManager.createSuccessEmbed(
          'Payment Completed',
          `Invoice ${invoiceId} has been paid successfully`
        );

        successEmbed.addFields(
          { name: 'Amount', value: ValidationManager.formatCurrency(finalAmount), inline: true },
          { name: 'Customer', value: invoice.customerId, inline: true },
          { name: 'Product', value: invoice.productName, inline: false }
        );

        await this.bot.channelManager.sendLog('paymentLogs', successEmbed);
      }

      // Set up deposit reminder if this was a deposit
      if (invoice.isDeposit && invoice.depositAmount) {
        await this.scheduleDepositReminder(invoice);
      }

      // Remove from active tracking
      this.activeInvoices.delete(invoiceId);

      // Backup completed payment
      await BackupModel.create(BackupType.PAYMENT_DATA, invoice);

      this.logger.info(`Payment completed for invoice ${invoiceId}`);
      return true;

    } catch (error) {
      this.logger.error('Failed to complete payment:', error);
      return false;
    }
  }

  async cancelPayment(invoiceId: string, reason: string): Promise<boolean> {
    try {
      const invoice = this.activeInvoices.get(invoiceId);
      if (!invoice) return false;

      invoice.status = PaymentStatus.CANCELLED;

      // Notify customer
      await this.invoiceManager.notifyPaymentCancellation(invoice, reason);

      // Log cancellation
      if (this.bot.channelManager) {
        const cancelEmbed = EmbedManager.createWarningEmbed(
          'Payment Cancelled',
          `Invoice ${invoiceId} was cancelled`
        );

        cancelEmbed.addFields(
          { name: 'Reason', value: reason, inline: false },
          { name: 'Customer', value: invoice.customerId, inline: true }
        );

        await this.bot.channelManager.sendLog('paymentLogs', cancelEmbed);
      }

      // Remove from active tracking
      this.activeInvoices.delete(invoiceId);

      this.logger.info(`Payment cancelled for invoice ${invoiceId}: ${reason}`);
      return true;

    } catch (error) {
      this.logger.error('Failed to cancel payment:', error);
      return false;
    }
  }

  async requestRefund(invoiceId: string, customerId: string, reason: string): Promise<boolean> {
    try {
      return await this.refundManager.createRefundRequest(invoiceId, customerId, reason);
    } catch (error) {
      this.logger.error('Failed to request refund:', error);
      return false;
    }
  }

  async processRefund(invoiceId: string, staffId: string, approved: boolean, reason?: string): Promise<boolean> {
    try {
      return await this.refundManager.processRefundRequest(invoiceId, staffId, approved, reason);
    } catch (error) {
      this.logger.error('Failed to process refund:', error);
      return false;
    }
  }

  async getInvoiceStatus(invoiceId: string): Promise<InvoiceData | null> {
    return this.activeInvoices.get(invoiceId) || null;
  }

  async handleButtonInteraction(interaction: any, params: string[]): Promise<void> {
    const [action, invoiceId] = params;

    try {
      switch (action) {
        case 'view':
          await this.invoiceManager.showInvoiceDetails(interaction, invoiceId);
          break;

        case 'cancel':
          if (PermissionManager.isStaff(interaction.member)) {
            await this.cancelPayment(invoiceId, 'Cancelled by staff');
            await interaction.reply({ content: 'Invoice cancelled successfully.', ephemeral: true });
          } else {
            await interaction.reply({ content: 'Only staff can cancel invoices.', ephemeral: true });
          }
          break;

        case 'refund':
          if (PermissionManager.isStaff(interaction.member)) {
            await this.refundManager.initiateStaffRefund(interaction, invoiceId);
          } else {
            await this.refundManager.initiateCustomerRefund(interaction, invoiceId);
          }
          break;

        default:
          await interaction.reply({ content: 'Unknown payment action.', ephemeral: true });
      }
    } catch (error) {
      this.logger.error('Error handling payment button interaction:', error);
      const errorEmbed = EmbedManager.createErrorEmbed(
        'Error',
        'An error occurred while processing your request.'
      );
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }

  private async scheduleDepositReminder(invoice: InvoiceData): Promise<void> {
    try {
      if (!this.bot.channelManager || !invoice.ticketId) return;

      const remainingAmount = invoice.amount - (invoice.depositAmount || 0);
      const reminderEmbed = EmbedManager.createInfoEmbed(
        'Deposit Payment Reminder',
        `Deposit payment completed for invoice ${invoice.invoiceId}. Remaining balance: ${ValidationManager.formatCurrency(remainingAmount)}`
      );

      reminderEmbed.addFields(
        { name: 'Staff Member', value: `<@${invoice.staffId}>`, inline: true },
        { name: 'Customer', value: invoice.customerId, inline: true },
        { name: 'Ticket', value: invoice.ticketId, inline: true }
      );

      await this.bot.channelManager.sendLog('alerts', reminderEmbed);

      this.logger.info(`Scheduled deposit reminder for invoice ${invoice.invoiceId}`);
    } catch (error) {
      this.logger.error('Failed to schedule deposit reminder:', error);
    }
  }

  private startExpirationTimer(): void {
    setInterval(async () => {
      await this.checkExpiredInvoices();
    }, 300000); // Check every 5 minutes
  }

  private async checkExpiredInvoices(): Promise<void> {
    const now = new Date();

    for (const [invoiceId, invoice] of this.activeInvoices.entries()) {
      if (invoice.status === PaymentStatus.PENDING && invoice.expiresAt <= now) {
        await this.cancelPayment(invoiceId, 'Invoice expired');
      }
    }
  }

  // Public getters for analytics
  public getActiveInvoicesCount(): number {
    return this.activeInvoices.size;
  }

  public getPendingAmount(): number {
    return Array.from(this.activeInvoices.values())
      .filter(invoice => invoice.status === PaymentStatus.PENDING)
      .reduce((total, invoice) => {
        const amount = invoice.isDeposit && invoice.depositAmount 
          ? invoice.depositAmount 
          : invoice.amount;
        return total + amount;
      }, 0);
  }

  public getInvoicesByStatus(status: PaymentStatus): InvoiceData[] {
    return Array.from(this.activeInvoices.values())
      .filter(invoice => invoice.status === status);
  }
}