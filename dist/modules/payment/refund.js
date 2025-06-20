"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundManager = void 0;
const payment_1 = require("../../types/payment");
const database_1 = require("../../types/database");
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
const permissions_1 = require("@utils/permissions");
const helpers_1 = require("@utils/helpers");
const validation_1 = require("@utils/validation");
const Backup_1 = require("@database/models/Backup");
const Analytics_1 = require("@database/models/Analytics");
class RefundManager {
    bot;
    logger;
    activeRefunds = new Map();
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('RefundManager');
    }
    async createRefundRequest(invoiceId, customerId, reason) {
        try {
            if (this.activeRefunds.has(invoiceId)) {
                this.logger.warn(`Refund already exists for invoice: ${invoiceId}`);
                return false;
            }
            const refundRequest = {
                invoiceId,
                customerId,
                requestedBy: customerId,
                reason,
                amount: 0,
                status: payment_1.RefundStatus.REQUESTED,
                createdAt: new Date()
            };
            this.activeRefunds.set(invoiceId, refundRequest);
            await this.sendRefundRequestToStaff(refundRequest);
            const user = await this.bot.client.users.fetch(customerId);
            if (user) {
                const confirmEmbed = embed_1.EmbedManager.createInfoEmbed('Refund Request Submitted', `Your refund request for invoice ${invoiceId} has been submitted and is under review.`);
                confirmEmbed.addFields({
                    name: 'Reason',
                    value: reason,
                    inline: false
                });
                await helpers_1.HelperUtils.safeDMSend(user, confirmEmbed);
            }
            await Backup_1.BackupModel.create(database_1.BackupType.PAYMENT_DATA, refundRequest);
            this.logger.info(`Created refund request for invoice ${invoiceId}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to create refund request:', error);
            return false;
        }
    }
    async processRefundRequest(invoiceId, staffId, approved, reason) {
        try {
            const refundRequest = this.activeRefunds.get(invoiceId);
            if (!refundRequest) {
                this.logger.warn(`No refund request found for invoice: ${invoiceId}`);
                return false;
            }
            refundRequest.status = approved ? payment_1.RefundStatus.APPROVED : payment_1.RefundStatus.DENIED;
            refundRequest.processedAt = new Date();
            refundRequest.processedBy = staffId;
            if (approved) {
                await this.executeRefund(refundRequest);
                await Analytics_1.AnalyticsModel.updateCurrentWeekRevenue(-refundRequest.amount);
                if (this.bot.channelManager) {
                    const approvalEmbed = embed_1.EmbedManager.createSuccessEmbed('Refund Approved', `Refund request for invoice ${invoiceId} has been approved and processed.`);
                    approvalEmbed.addFields({ name: 'Processed by', value: `<@${staffId}>`, inline: true }, { name: 'Amount', value: validation_1.ValidationManager.formatCurrency(refundRequest.amount), inline: true }, { name: 'Customer', value: refundRequest.customerId, inline: true });
                    await this.bot.channelManager.sendLog('paymentLogs', approvalEmbed);
                }
            }
            else {
                if (this.bot.channelManager) {
                    const denialEmbed = embed_1.EmbedManager.createWarningEmbed('Refund Denied', `Refund request for invoice ${invoiceId} has been denied.`);
                    denialEmbed.addFields({ name: 'Denied by', value: `<@${staffId}>`, inline: true }, { name: 'Reason', value: reason || 'No reason provided', inline: false });
                    await this.bot.channelManager.sendLog('paymentLogs', denialEmbed);
                }
            }
            await this.notifyRefundDecision(refundRequest, approved, reason);
            if (refundRequest.status === payment_1.RefundStatus.APPROVED || refundRequest.status === payment_1.RefundStatus.DENIED) {
                this.activeRefunds.delete(invoiceId);
            }
            await Backup_1.BackupModel.create(database_1.BackupType.PAYMENT_DATA, refundRequest);
            this.logger.info(`Refund request for invoice ${invoiceId} ${approved ? 'approved' : 'denied'} by ${staffId}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to process refund request:', error);
            return false;
        }
    }
    async initiateStaffRefund(interaction, invoiceId) {
        try {
            if (!permissions_1.PermissionManager.isStaff(interaction.member)) {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only staff members can initiate refunds.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }
            const refundEmbed = embed_1.EmbedManager.createInfoEmbed('Staff Refund Initiation', `Do you want to create a refund for invoice ${invoiceId}?`);
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
        }
        catch (error) {
            this.logger.error('Failed to initiate staff refund:', error);
        }
    }
    async initiateCustomerRefund(interaction, invoiceId) {
        try {
            if (this.activeRefunds.has(invoiceId)) {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Refund Already Requested', 'A refund request for this invoice is already pending review.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }
            const refundEmbed = embed_1.EmbedManager.createInfoEmbed('Request Refund', 'Please provide a reason for your refund request:');
            const defaultReason = 'Customer refund request via Discord';
            const success = await this.createRefundRequest(invoiceId, interaction.user.id, defaultReason);
            if (success) {
                const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Refund Request Submitted', 'Your refund request has been submitted for review. Our staff will process it shortly.');
                await interaction.reply({ embeds: [successEmbed], ephemeral: true });
            }
            else {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Request Failed', 'Failed to submit your refund request. Please try again later.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
        catch (error) {
            this.logger.error('Failed to initiate customer refund:', error);
        }
    }
    async sendRefundRequestToStaff(refundRequest) {
        try {
            if (!this.bot.channelManager)
                return;
            const requestEmbed = embed_1.EmbedManager.createWarningEmbed('New Refund Request', `A refund has been requested for invoice ${refundRequest.invoiceId}`);
            requestEmbed.addFields({ name: 'Customer', value: refundRequest.customerId, inline: true }, { name: 'Requested by', value: `<@${refundRequest.requestedBy}>`, inline: true }, { name: 'Reason', value: refundRequest.reason, inline: false }, { name: 'Requested at', value: helpers_1.HelperUtils.formatTimestamp(refundRequest.createdAt), inline: true });
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
        }
        catch (error) {
            this.logger.error('Failed to send refund request to staff:', error);
        }
    }
    async executeRefund(refundRequest) {
        try {
            refundRequest.status = payment_1.RefundStatus.PROCESSED;
            refundRequest.processedAt = new Date();
            this.logger.info(`Executed refund for invoice ${refundRequest.invoiceId}`);
        }
        catch (error) {
            this.logger.error('Failed to execute refund:', error);
            throw error;
        }
    }
    async notifyRefundDecision(refundRequest, approved, reason) {
        try {
            const user = await this.bot.client.users.fetch(refundRequest.customerId);
            if (!user)
                return;
            if (approved) {
                const approvalEmbed = embed_1.EmbedManager.createSuccessEmbed('Refund Approved', `Your refund request for invoice ${refundRequest.invoiceId} has been approved and processed.`);
                approvalEmbed.addFields({ name: 'Amount', value: validation_1.ValidationManager.formatCurrency(refundRequest.amount), inline: true }, { name: 'Processing Time', value: '3-5 business days', inline: true });
                approvalEmbed.setFooter({
                    text: 'The refund will appear in your original payment method.'
                });
                await helpers_1.HelperUtils.safeDMSend(user, approvalEmbed);
            }
            else {
                const denialEmbed = embed_1.EmbedManager.createErrorEmbed('Refund Denied', `Your refund request for invoice ${refundRequest.invoiceId} has been denied.`);
                denialEmbed.addFields({
                    name: 'Reason',
                    value: reason || 'No specific reason provided',
                    inline: false
                });
                denialEmbed.setFooter({
                    text: 'If you believe this decision was made in error, please contact our support team.'
                });
                await helpers_1.HelperUtils.safeDMSend(user, denialEmbed);
            }
        }
        catch (error) {
            this.logger.error('Failed to notify refund decision:', error);
        }
    }
    getActiveRefunds() {
        return Array.from(this.activeRefunds.values());
    }
    getRefundByInvoice(invoiceId) {
        return this.activeRefunds.get(invoiceId) || null;
    }
}
exports.RefundManager = RefundManager;
//# sourceMappingURL=refund.js.map