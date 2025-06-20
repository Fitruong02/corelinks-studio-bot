"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceManager = void 0;
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
const validation_1 = require("@utils/validation");
const helpers_1 = require("@utils/helpers");
class InvoiceManager {
    bot;
    logger;
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('InvoiceManager');
    }
    async sendInvoiceToCustomer(invoice) {
        try {
            const user = await this.bot.client.users.fetch(invoice.customerId);
            if (!user) {
                this.logger.warn(`User not found: ${invoice.customerId}`);
                return;
            }
            const finalAmount = invoice.isDeposit && invoice.depositAmount
                ? invoice.depositAmount
                : invoice.amount;
            const invoiceEmbed = embed_1.EmbedManager.createPaymentEmbed(invoice.invoiceId, finalAmount, invoice.productName);
            invoiceEmbed.addFields({ name: 'Payment Type', value: invoice.isDeposit ? 'Deposit Payment' : 'Full Payment', inline: true }, { name: 'Expires', value: helpers_1.HelperUtils.formatTimestamp(invoice.expiresAt), inline: true });
            if (invoice.isDeposit && invoice.depositAmount) {
                const remainingAmount = invoice.amount - invoice.depositAmount;
                invoiceEmbed.addFields({
                    name: 'Remaining Balance',
                    value: validation_1.ValidationManager.formatCurrency(remainingAmount),
                    inline: true
                });
            }
            const paymentRow = {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 5,
                        label: 'Pay with Banking',
                        url: invoice.paymentUrl,
                        emoji: { name: '🏦' }
                    },
                    {
                        type: 2,
                        style: 1,
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
                        style: 2,
                        label: 'View Details',
                        customId: `payment_view_${invoice.invoiceId}`,
                        emoji: { name: 'ℹ️' }
                    },
                    {
                        type: 2,
                        style: 4,
                        label: 'Request Refund',
                        customId: `payment_refund_${invoice.invoiceId}`,
                        emoji: { name: '💰' }
                    }
                ]
            };
            await helpers_1.HelperUtils.safeDMSend(user, {
                embeds: [invoiceEmbed],
                components: [paymentRow, actionRow]
            });
            this.logger.info(`Sent invoice ${invoice.invoiceId} to customer ${invoice.customerId}`);
        }
        catch (error) {
            this.logger.error('Failed to send invoice to customer:', error);
        }
    }
    async showInvoiceDetails(interaction, invoiceId) {
        try {
            const detailsEmbed = embed_1.EmbedManager.createInfoEmbed('Invoice Details', `Detailed information for invoice ${invoiceId}`);
            detailsEmbed.addFields({ name: 'Status', value: 'Pending', inline: true }, { name: 'Created', value: helpers_1.HelperUtils.formatTimestamp(new Date()), inline: true }, { name: 'Payment Method', value: 'Banking', inline: true });
            await interaction.reply({ embeds: [detailsEmbed], ephemeral: true });
        }
        catch (error) {
            this.logger.error('Failed to show invoice details:', error);
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'Failed to retrieve invoice details.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
    async notifyPaymentSuccess(invoice) {
        try {
            const user = await this.bot.client.users.fetch(invoice.customerId);
            if (!user)
                return;
            const finalAmount = invoice.isDeposit && invoice.depositAmount
                ? invoice.depositAmount
                : invoice.amount;
            const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Payment Successful!', `Your payment for ${invoice.productName} has been processed successfully.`);
            successEmbed.addFields({ name: 'Invoice ID', value: invoice.invoiceId, inline: true }, { name: 'Amount Paid', value: validation_1.ValidationManager.formatCurrency(finalAmount), inline: true }, { name: 'Processed At', value: helpers_1.HelperUtils.formatTimestamp(new Date()), inline: true });
            if (invoice.isDeposit && invoice.depositAmount) {
                const remainingAmount = invoice.amount - invoice.depositAmount;
                successEmbed.addFields({
                    name: 'Remaining Balance',
                    value: `${validation_1.ValidationManager.formatCurrency(remainingAmount)} (will be invoiced separately)`,
                    inline: false
                });
            }
            successEmbed.setFooter({
                text: 'Thank you for your business! You now have Customer role access.'
            });
            await helpers_1.HelperUtils.safeDMSend(user, successEmbed);
        }
        catch (error) {
            this.logger.error('Failed to notify payment success:', error);
        }
    }
    async notifyPaymentCancellation(invoice, reason) {
        try {
            const user = await this.bot.client.users.fetch(invoice.customerId);
            if (!user)
                return;
            const cancellationEmbed = embed_1.EmbedManager.createWarningEmbed('Payment Cancelled', `Your payment for ${invoice.productName} has been cancelled.`);
            cancellationEmbed.addFields({ name: 'Invoice ID', value: invoice.invoiceId, inline: true }, { name: 'Reason', value: reason, inline: true }, { name: 'Cancelled At', value: helpers_1.HelperUtils.formatTimestamp(new Date()), inline: true });
            cancellationEmbed.setFooter({
                text: 'If you believe this was an error, please contact our support team.'
            });
            await helpers_1.HelperUtils.safeDMSend(user, cancellationEmbed);
        }
        catch (error) {
            this.logger.error('Failed to notify payment cancellation:', error);
        }
    }
    async sendPaymentReminder(invoice) {
        try {
            const user = await this.bot.client.users.fetch(invoice.customerId);
            if (!user)
                return;
            const timeLeft = invoice.expiresAt.getTime() - Date.now();
            const minutesLeft = Math.floor(timeLeft / 60000);
            if (minutesLeft <= 15 && minutesLeft > 0) {
                const reminderEmbed = embed_1.EmbedManager.createWarningEmbed('Payment Reminder', `Your invoice ${invoice.invoiceId} will expire in ${minutesLeft} minutes.`);
                reminderEmbed.addFields({
                    name: 'Quick Payment',
                    value: `[Pay Now](${invoice.paymentUrl})`,
                    inline: true
                });
                await helpers_1.HelperUtils.safeDMSend(user, reminderEmbed);
                this.logger.info(`Sent payment reminder for invoice ${invoice.invoiceId}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to send payment reminder:', error);
        }
    }
}
exports.InvoiceManager = InvoiceManager;
//# sourceMappingURL=invoice.js.map