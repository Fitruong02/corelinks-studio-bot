"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentManager = void 0;
const payment_1 = require("../../types/payment");
const database_1 = require("../../types/database");
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
const validation_1 = require("@utils/validation");
const permissions_1 = require("@utils/permissions");
const Backup_1 = require("@database/models/Backup");
const Analytics_1 = require("@database/models/Analytics");
const payos_1 = require("./payos");
const invoice_1 = require("./invoice");
const refund_1 = require("./refund");
class PaymentManager {
    bot;
    logger;
    activeInvoices = new Map();
    payosManager;
    invoiceManager;
    refundManager;
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('PaymentManager');
        this.payosManager = new payos_1.PayOSManager(bot);
        this.invoiceManager = new invoice_1.InvoiceManager(bot);
        this.refundManager = new refund_1.RefundManager(bot);
        this.startExpirationTimer();
    }
    async createInvoice(staffId, customerId, productName, amount, isDeposit = false, depositAmount, ticketId) {
        try {
            if (!validation_1.ValidationManager.isValidAmount(amount)) {
                this.logger.warn(`Invalid amount: ${amount}`);
                return null;
            }
            const invoiceId = validation_1.ValidationManager.generateInvoiceId();
            const finalAmount = isDeposit && depositAmount ? depositAmount : amount;
            const invoiceData = {
                invoiceId,
                ticketId,
                customerId,
                staffId,
                productName,
                amount,
                depositAmount,
                isDeposit,
                paymentMethod: payment_1.PaymentMethod.BANKING,
                status: payment_1.PaymentStatus.PENDING,
                expiresAt: new Date(Date.now() + 3600000),
                createdAt: new Date()
            };
            this.activeInvoices.set(invoiceId, invoiceData);
            const paymentResult = await this.payosManager.createPaymentLink(invoiceData);
            if (!paymentResult) {
                this.activeInvoices.delete(invoiceId);
                return null;
            }
            invoiceData.payosOrderId = paymentResult.orderCode;
            invoiceData.paymentUrl = paymentResult.checkoutUrl;
            invoiceData.qrCode = paymentResult.qrCode;
            await this.invoiceManager.sendInvoiceToCustomer(invoiceData);
            if (this.bot.channelManager) {
                const logEmbed = embed_1.EmbedManager.createPaymentEmbed(invoiceData.invoiceId, finalAmount, productName);
                logEmbed.addFields({ name: 'Created by', value: `<@${staffId}>`, inline: true }, { name: 'Customer', value: customerId, inline: true }, { name: 'Type', value: isDeposit ? 'Deposit' : 'Full Payment', inline: true });
                await this.bot.channelManager.sendLog('paymentLogs', logEmbed);
            }
            await Backup_1.BackupModel.create(database_1.BackupType.PAYMENT_DATA, invoiceData);
            this.logger.info(`Created invoice ${invoiceId} for ${finalAmount} VND`);
            return invoiceData;
        }
        catch (error) {
            this.logger.error('Failed to create invoice:', error);
            return null;
        }
    }
    async processPaymentWebhook(webhookData) {
        try {
            const orderCode = webhookData.orderCode;
            const status = webhookData.status;
            const invoice = Array.from(this.activeInvoices.values())
                .find(inv => inv.payosOrderId === orderCode.toString());
            if (!invoice) {
                this.logger.warn(`No invoice found for order code: ${orderCode}`);
                return;
            }
            if (status === 'PAID') {
                await this.completePayment(invoice.invoiceId);
            }
            else if (status === 'CANCELLED') {
                await this.cancelPayment(invoice.invoiceId, 'Payment cancelled by user');
            }
        }
        catch (error) {
            this.logger.error('Failed to process payment webhook:', error);
        }
    }
    async completePayment(invoiceId) {
        try {
            const invoice = this.activeInvoices.get(invoiceId);
            if (!invoice || invoice.status !== payment_1.PaymentStatus.PENDING) {
                return false;
            }
            invoice.status = payment_1.PaymentStatus.PAID;
            invoice.paidAt = new Date();
            const guild = this.bot.client.guilds.cache.first();
            if (guild) {
                const member = await guild.members.fetch(invoice.customerId);
                if (member) {
                    await permissions_1.PermissionManager.grantCustomerRole(member);
                }
            }
            const finalAmount = invoice.isDeposit && invoice.depositAmount
                ? invoice.depositAmount
                : invoice.amount;
            await Analytics_1.AnalyticsModel.updateCurrentWeekRevenue(finalAmount);
            await this.invoiceManager.notifyPaymentSuccess(invoice);
            if (this.bot.channelManager) {
                const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Payment Completed', `Invoice ${invoiceId} has been paid successfully`);
                successEmbed.addFields({ name: 'Amount', value: validation_1.ValidationManager.formatCurrency(finalAmount), inline: true }, { name: 'Customer', value: invoice.customerId, inline: true }, { name: 'Product', value: invoice.productName, inline: false });
                await this.bot.channelManager.sendLog('paymentLogs', successEmbed);
            }
            if (invoice.isDeposit && invoice.depositAmount) {
                await this.scheduleDepositReminder(invoice);
            }
            this.activeInvoices.delete(invoiceId);
            await Backup_1.BackupModel.create(database_1.BackupType.PAYMENT_DATA, invoice);
            this.logger.info(`Payment completed for invoice ${invoiceId}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to complete payment:', error);
            return false;
        }
    }
    async cancelPayment(invoiceId, reason) {
        try {
            const invoice = this.activeInvoices.get(invoiceId);
            if (!invoice)
                return false;
            invoice.status = payment_1.PaymentStatus.CANCELLED;
            await this.invoiceManager.notifyPaymentCancellation(invoice, reason);
            if (this.bot.channelManager) {
                const cancelEmbed = embed_1.EmbedManager.createWarningEmbed('Payment Cancelled', `Invoice ${invoiceId} was cancelled`);
                cancelEmbed.addFields({ name: 'Reason', value: reason, inline: false }, { name: 'Customer', value: invoice.customerId, inline: true });
                await this.bot.channelManager.sendLog('paymentLogs', cancelEmbed);
            }
            this.activeInvoices.delete(invoiceId);
            this.logger.info(`Payment cancelled for invoice ${invoiceId}: ${reason}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to cancel payment:', error);
            return false;
        }
    }
    async requestRefund(invoiceId, customerId, reason) {
        try {
            return await this.refundManager.createRefundRequest(invoiceId, customerId, reason);
        }
        catch (error) {
            this.logger.error('Failed to request refund:', error);
            return false;
        }
    }
    async processRefund(invoiceId, staffId, approved, reason) {
        try {
            return await this.refundManager.processRefundRequest(invoiceId, staffId, approved, reason);
        }
        catch (error) {
            this.logger.error('Failed to process refund:', error);
            return false;
        }
    }
    async getInvoiceStatus(invoiceId) {
        return this.activeInvoices.get(invoiceId) || null;
    }
    async handleButtonInteraction(interaction, params) {
        const [action, invoiceId] = params;
        try {
            switch (action) {
                case 'view':
                    await this.invoiceManager.showInvoiceDetails(interaction, invoiceId);
                    break;
                case 'cancel':
                    if (permissions_1.PermissionManager.isStaff(interaction.member)) {
                        await this.cancelPayment(invoiceId, 'Cancelled by staff');
                        await interaction.reply({ content: 'Invoice cancelled successfully.', ephemeral: true });
                    }
                    else {
                        await interaction.reply({ content: 'Only staff can cancel invoices.', ephemeral: true });
                    }
                    break;
                case 'refund':
                    if (permissions_1.PermissionManager.isStaff(interaction.member)) {
                        await this.refundManager.initiateStaffRefund(interaction, invoiceId);
                    }
                    else {
                        await this.refundManager.initiateCustomerRefund(interaction, invoiceId);
                    }
                    break;
                default:
                    await interaction.reply({ content: 'Unknown payment action.', ephemeral: true });
            }
        }
        catch (error) {
            this.logger.error('Error handling payment button interaction:', error);
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while processing your request.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
    async scheduleDepositReminder(invoice) {
        try {
            if (!this.bot.channelManager || !invoice.ticketId)
                return;
            const remainingAmount = invoice.amount - (invoice.depositAmount || 0);
            const reminderEmbed = embed_1.EmbedManager.createInfoEmbed('Deposit Payment Reminder', `Deposit payment completed for invoice ${invoice.invoiceId}. Remaining balance: ${validation_1.ValidationManager.formatCurrency(remainingAmount)}`);
            reminderEmbed.addFields({ name: 'Staff Member', value: `<@${invoice.staffId}>`, inline: true }, { name: 'Customer', value: invoice.customerId, inline: true }, { name: 'Ticket', value: invoice.ticketId, inline: true });
            await this.bot.channelManager.sendLog('alerts', reminderEmbed);
            this.logger.info(`Scheduled deposit reminder for invoice ${invoice.invoiceId}`);
        }
        catch (error) {
            this.logger.error('Failed to schedule deposit reminder:', error);
        }
    }
    startExpirationTimer() {
        setInterval(async () => {
            await this.checkExpiredInvoices();
        }, 300000);
    }
    async checkExpiredInvoices() {
        const now = new Date();
        for (const [invoiceId, invoice] of this.activeInvoices.entries()) {
            if (invoice.status === payment_1.PaymentStatus.PENDING && invoice.expiresAt <= now) {
                await this.cancelPayment(invoiceId, 'Invoice expired');
            }
        }
    }
    getActiveInvoicesCount() {
        return this.activeInvoices.size;
    }
    getPendingAmount() {
        return Array.from(this.activeInvoices.values())
            .filter(invoice => invoice.status === payment_1.PaymentStatus.PENDING)
            .reduce((total, invoice) => {
            const amount = invoice.isDeposit && invoice.depositAmount
                ? invoice.depositAmount
                : invoice.amount;
            return total + amount;
        }, 0);
    }
    getInvoicesByStatus(status) {
        return Array.from(this.activeInvoices.values())
            .filter(invoice => invoice.status === status);
    }
}
exports.PaymentManager = PaymentManager;
//# sourceMappingURL=index.js.map