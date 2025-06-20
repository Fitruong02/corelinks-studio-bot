"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketManager = void 0;
const ticket_1 = require("../../types/ticket");
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
const validation_1 = require("@utils/validation");
const helpers_1 = require("@utils/helpers");
const permissions_1 = require("@utils/permissions");
const Backup_1 = require("@database/models/Backup");
const database_1 = require("../../types/database");
const anonymous_1 = require("./anonymous");
const rating_1 = require("./rating");
class TicketManager {
    bot;
    logger;
    activeTickets = new Map();
    userTickets = new Map();
    anonymousManager;
    ratingManager;
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('TicketManager');
        this.anonymousManager = new anonymous_1.AnonymousManager(bot);
        this.ratingManager = new rating_1.TicketRatingManager(bot);
        this.startAutoCloseTimer();
    }
    async createTicketRequest(userId, username, service, description) {
        try {
            if (this.userTickets.has(userId)) {
                return false;
            }
            const ticketId = validation_1.ValidationManager.generateTicketId();
            const customerId = validation_1.ValidationManager.generateCustomerId();
            const ticketData = {
                ticketId,
                customerId,
                userId,
                username,
                service,
                status: ticket_1.TicketStatus.PENDING,
                priority: ticket_1.TicketPriority.MEDIUM,
                createdAt: new Date(),
                lastActivity: new Date()
            };
            this.activeTickets.set(ticketId, ticketData);
            this.userTickets.set(userId, ticketId);
            await this.sendTicketRequest(ticketData, description);
            await Backup_1.BackupModel.create(database_1.BackupType.TICKET_DATA, ticketData);
            this.logger.info(`Created ticket request: ${ticketId} for user ${username}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to create ticket request:', error);
            return false;
        }
    }
    async approveTicket(ticketId, staffId) {
        try {
            const ticket = this.activeTickets.get(ticketId);
            if (!ticket || ticket.status !== ticket_1.TicketStatus.PENDING) {
                return false;
            }
            const guild = this.bot.client.guilds.cache.get(this.bot.client.guilds.cache.first()?.id || '');
            if (!guild)
                return false;
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
            ticket.status = ticket_1.TicketStatus.APPROVED;
            ticket.assignedStaff = staffId;
            ticket.channelId = ticketChannel.id;
            ticket.lastActivity = new Date();
            await this.anonymousManager.setupAnonymousChannel(ticket, ticketChannel.id);
            const welcomeEmbed = embed_1.EmbedManager.createTicketEmbed(ticket.ticketId, ticket.customerId, ticket.service);
            await ticketChannel.send({
                embeds: [welcomeEmbed],
                content: `<@${staffId}> - Ticket được phê duyệt. Khách hàng sẽ được thông báo qua DM.`
            });
            const user = await this.bot.client.users.fetch(ticket.userId);
            if (user) {
                const dmEmbed = embed_1.EmbedManager.createSuccessEmbed('Ticket Approved', `Your ticket ${ticket.ticketId} has been approved. You can now communicate with our support team. Simply reply to this message to chat.`);
                await helpers_1.HelperUtils.safeDMSend(user, dmEmbed);
            }
            if (this.bot.channelManager) {
                const logEmbed = embed_1.EmbedManager.createLogEmbed('Ticket Approved', `Ticket ${ticket.ticketId} approved by <@${staffId}>`, [
                    { name: 'Customer ID', value: ticket.customerId, inline: true },
                    { name: 'Service', value: ticket.service, inline: true },
                    { name: 'Channel', value: `<#${ticketChannel.id}>`, inline: true }
                ]);
                await this.bot.channelManager.sendLog('ticketLogs', logEmbed);
            }
            this.logger.info(`Ticket ${ticketId} approved by staff ${staffId}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to approve ticket:', error);
            return false;
        }
    }
    async closeTicket(ticketId, closedBy, reason) {
        try {
            const ticket = this.activeTickets.get(ticketId);
            if (!ticket)
                return false;
            ticket.status = ticket_1.TicketStatus.CLOSED;
            ticket.closedAt = new Date();
            if (ticket.channelId) {
                const channel = await this.bot.client.channels.fetch(ticket.channelId);
                if (channel &&
                    channel.isTextBased() &&
                    ('send' in channel) &&
                    typeof channel.send === 'function') {
                    if (channel.type === 0 ||
                        channel.type === 5 ||
                        channel.type === 11 ||
                        channel.type === 12) {
                        await channel.edit({ name: `closed-${ticket.customerId.toLowerCase()}` });
                    }
                    const closeEmbed = embed_1.EmbedManager.createInfoEmbed('Ticket Closed', `This ticket has been closed. Reason: ${reason || 'No reason provided'}`);
                    await channel.send({ embeds: [closeEmbed] });
                }
            }
            this.activeTickets.delete(ticketId);
            this.userTickets.delete(ticket.userId);
            await this.ratingManager.requestRating(ticket);
            if (this.bot.channelManager) {
                const logEmbed = embed_1.EmbedManager.createLogEmbed('Ticket Closed', `Ticket ${ticket.ticketId} closed`, [
                    { name: 'Closed By', value: `<@${closedBy}>`, inline: true },
                    { name: 'Reason', value: reason || 'No reason provided', inline: true },
                    { name: 'Duration', value: this.calculateTicketDuration(ticket), inline: true }
                ]);
                await this.bot.channelManager.sendLog('ticketLogs', logEmbed);
            }
            await Backup_1.BackupModel.create(database_1.BackupType.TICKET_DATA, ticket);
            this.logger.info(`Ticket ${ticketId} closed by ${closedBy}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to close ticket:', error);
            return false;
        }
    }
    async setTicketPriority(ticketId, priority, staffId) {
        try {
            const ticket = this.activeTickets.get(ticketId);
            if (!ticket)
                return false;
            const oldPriority = ticket.priority;
            ticket.priority = priority;
            ticket.lastActivity = new Date();
            if (this.bot.channelManager) {
                const logEmbed = embed_1.EmbedManager.createLogEmbed('Ticket Priority Updated', `Ticket ${ticketId} priority changed from ${oldPriority} to ${priority}`, [
                    { name: 'Updated By', value: `<@${staffId}>`, inline: true },
                    { name: 'Customer ID', value: ticket.customerId, inline: true }
                ]);
                await this.bot.channelManager.sendLog('ticketLogs', logEmbed);
            }
            this.logger.info(`Ticket ${ticketId} priority updated to ${priority} by ${staffId}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to set ticket priority:', error);
            return false;
        }
    }
    async assignTicket(ticketId, staffId, assignedBy) {
        try {
            const ticket = this.activeTickets.get(ticketId);
            if (!ticket)
                return false;
            const oldStaff = ticket.assignedStaff;
            ticket.assignedStaff = staffId;
            ticket.lastActivity = new Date();
            if (ticket.channelId) {
                const channel = await this.bot.client.channels.fetch(ticket.channelId);
                if (channel && 'permissionOverwrites' in channel) {
                    if (oldStaff) {
                        await channel.permissionOverwrites.delete(oldStaff);
                    }
                    await channel.permissionOverwrites.create(staffId, {
                        ViewChannel: true,
                        SendMessages: true,
                        ReadMessageHistory: true
                    });
                }
            }
            if (this.bot.channelManager) {
                const logEmbed = embed_1.EmbedManager.createLogEmbed('Ticket Assignment Updated', `Ticket ${ticketId} assigned to <@${staffId}>`, [
                    { name: 'Assigned By', value: `<@${assignedBy}>`, inline: true },
                    { name: 'Previous Staff', value: oldStaff ? `<@${oldStaff}>` : 'None', inline: true },
                    { name: 'Customer ID', value: ticket.customerId, inline: true }
                ]);
                await this.bot.channelManager.sendLog('ticketLogs', logEmbed);
            }
            this.logger.info(`Ticket ${ticketId} assigned to ${staffId} by ${assignedBy}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to assign ticket:', error);
            return false;
        }
    }
    async getTicketStatus(userId) {
        const ticketId = this.userTickets.get(userId);
        if (!ticketId)
            return null;
        return this.activeTickets.get(ticketId) || null;
    }
    async handleButtonInteraction(interaction, params) {
        const [action, ticketId] = params;
        try {
            if (!interaction.member || !permissions_1.PermissionManager.isStaff(interaction.member)) {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only staff members can perform this action.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }
            switch (action) {
                case 'approve':
                    const approved = await this.approveTicket(ticketId, interaction.user.id);
                    if (approved) {
                        const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Ticket Approved', `Ticket ${ticketId} has been approved and a private channel has been created.`);
                        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
                    }
                    else {
                        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Approval Failed', 'Failed to approve this ticket. It may have already been processed.');
                        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                    }
                    break;
                case 'close':
                    const closed = await this.closeTicket(ticketId, interaction.user.id, 'Closed by staff');
                    if (closed) {
                        const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Ticket Closed', `Ticket ${ticketId} has been closed successfully.`);
                        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
                    }
                    else {
                        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Close Failed', 'Failed to close this ticket.');
                        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                    }
                    break;
                default:
                    const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Unknown Action', 'Unknown button action.');
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
        catch (error) {
            this.logger.error('Error handling ticket button interaction:', error);
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while processing your request.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
    async handleServiceSelection(interaction, params) {
        try {
            const selectedService = interaction.values[0];
            const userId = interaction.user.id;
            const username = interaction.user.username;
            if (this.userTickets.has(userId)) {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Active Ticket Exists', 'You already have an active ticket. Please wait for it to be resolved before creating a new one.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }
            const created = await this.createTicketRequest(userId, username, selectedService, 'Service requested via dropdown');
            if (created) {
                const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Ticket Created', `Your ticket request for ${selectedService} has been submitted. Our staff will review it shortly.`);
                await interaction.reply({ embeds: [successEmbed], ephemeral: true });
            }
            else {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Creation Failed', 'Failed to create your ticket request. Please try again later.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
        catch (error) {
            this.logger.error('Error handling service selection:', error);
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while processing your selection.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
    async sendTicketRequest(ticket, description) {
        if (!this.bot.channelManager)
            return;
        const requestEmbed = embed_1.EmbedManager.createTicketEmbed(ticket.ticketId, ticket.customerId, ticket.service);
        requestEmbed.addFields({ name: 'Description', value: validation_1.ValidationManager.truncateText(description, 1000), inline: false }, { name: 'Created', value: helpers_1.HelperUtils.formatTimestamp(ticket.createdAt), inline: true }, { name: 'Priority', value: ticket.priority.toUpperCase(), inline: true });
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
    startAutoCloseTimer() {
        setInterval(async () => {
            await this.checkInactiveTickets();
        }, 3600000);
    }
    async checkInactiveTickets() {
        const now = new Date();
        const autoCloseDays = 7;
        for (const [ticketId, ticket] of this.activeTickets.entries()) {
            if (ticket.status === ticket_1.TicketStatus.ACTIVE || ticket.status === ticket_1.TicketStatus.WAITING) {
                const daysSinceActivity = (now.getTime() - ticket.lastActivity.getTime()) / (1000 * 3600 * 24);
                if (daysSinceActivity >= autoCloseDays) {
                    await this.closeTicket(ticketId, 'system', 'Auto-closed due to inactivity');
                }
            }
        }
    }
    calculateTicketDuration(ticket) {
        const start = ticket.createdAt;
        const end = ticket.closedAt || new Date();
        const duration = end.getTime() - start.getTime();
        const days = Math.floor(duration / (1000 * 3600 * 24));
        const hours = Math.floor((duration % (1000 * 3600 * 24)) / (1000 * 3600));
        const minutes = Math.floor((duration % (1000 * 3600)) / (1000 * 60));
        if (days > 0)
            return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0)
            return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }
    getActiveTicketsCount() {
        return this.activeTickets.size;
    }
    getTicketsByStatus(status) {
        return Array.from(this.activeTickets.values()).filter(ticket => ticket.status === status);
    }
    getAllActiveTickets() {
        return Array.from(this.activeTickets.values());
    }
}
exports.TicketManager = TicketManager;
//# sourceMappingURL=index.js.map