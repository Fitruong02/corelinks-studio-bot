"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketApprovalManager = void 0;
const ticket_1 = require("../../types/ticket");
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
const config_1 = require("@config/config");
class TicketApprovalManager {
    bot;
    logger;
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('TicketApprovalManager');
    }
    async createApprovalMessage(ticket, description) {
        try {
            if (!this.bot.channelManager)
                return;
            const approvalEmbed = embed_1.EmbedManager.createTicketEmbed(ticket.ticketId, ticket.customerId, ticket.service);
            approvalEmbed.addFields({ name: 'Description', value: description || 'No description provided', inline: false }, { name: 'Created', value: `<t:${Math.floor(ticket.createdAt.getTime() / 1000)}:F>`, inline: true }, { name: 'Status', value: ticket.status.toUpperCase(), inline: true });
            const actionRow = {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 3,
                        label: 'Approve Ticket',
                        customId: `ticket_approve_${ticket.ticketId}`,
                        emoji: { name: '✅' }
                    },
                    {
                        type: 2,
                        style: 4,
                        label: 'Reject Ticket',
                        customId: `ticket_reject_${ticket.ticketId}`,
                        emoji: { name: '❌' }
                    },
                    {
                        type: 2,
                        style: 1,
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
        }
        catch (error) {
            this.logger.error('Failed to create approval message:', error);
        }
    }
    createServiceAssignmentRow(ticket) {
        const serviceStaffRoles = {
            [ticket_1.ServiceType.GAME]: config_1.config.roles.gameServiceStaff,
            [ticket_1.ServiceType.DISCORD]: config_1.config.roles.discordServiceStaff,
            [ticket_1.ServiceType.MINECRAFT]: config_1.config.roles.minecraftServiceStaff
        };
        return {
            type: 1,
            components: [
                {
                    type: 3,
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
    async handleApproval(ticketId, staffId) {
        try {
            const { TicketManager } = await Promise.resolve().then(() => __importStar(require('./index')));
            const ticketManager = new TicketManager(this.bot);
            const success = await ticketManager.approveTicket(ticketId, staffId);
            if (success && this.bot.channelManager) {
                const approvalLogEmbed = embed_1.EmbedManager.createSuccessEmbed('Ticket Approved', `Ticket ${ticketId} has been approved by <@${staffId}>`);
                await this.bot.channelManager.sendLog('ticketLogs', approvalLogEmbed);
            }
            return success;
        }
        catch (error) {
            this.logger.error('Failed to handle approval:', error);
            return false;
        }
    }
    async handleRejection(ticketId, staffId, reason) {
        try {
            const user = await this.getTicketUser(ticketId);
            if (user) {
                const rejectionEmbed = embed_1.EmbedManager.createErrorEmbed('Ticket Rejected', `Your ticket ${ticketId} has been rejected.\n\n**Reason:** ${reason || 'No reason provided'}\n\nYou can create a new ticket if you believe this was an error.`);
                await user.send({ embeds: [rejectionEmbed] });
            }
            if (this.bot.channelManager) {
                const rejectionLogEmbed = embed_1.EmbedManager.createWarningEmbed('Ticket Rejected', `Ticket ${ticketId} was rejected by <@${staffId}>`);
                rejectionLogEmbed.addFields({
                    name: 'Reason',
                    value: reason || 'No reason provided',
                    inline: false
                });
                await this.bot.channelManager.sendLog('ticketLogs', rejectionLogEmbed);
            }
            this.logger.info(`Ticket ${ticketId} rejected by ${staffId}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to handle rejection:', error);
            return false;
        }
    }
    async handleServiceAssignment(ticketId, assignmentType, staffId) {
        try {
            if (assignmentType.startsWith('auto_')) {
                const service = assignmentType.replace('auto_', '');
                return await this.autoAssignByService(ticketId, service, staffId);
            }
            else if (assignmentType === 'manual') {
                return await this.requestManualAssignment(ticketId, staffId);
            }
            return false;
        }
        catch (error) {
            this.logger.error('Failed to handle service assignment:', error);
            return false;
        }
    }
    async autoAssignByService(ticketId, service, requestedBy) {
        try {
            const guild = this.bot.client.guilds.cache.first();
            if (!guild)
                return false;
            const serviceRoleId = this.getServiceRoleId(service);
            if (!serviceRoleId)
                return false;
            const serviceRole = guild.roles.cache.get(serviceRoleId);
            if (!serviceRole)
                return false;
            const availableStaff = serviceRole.members.filter(member => member.presence?.status === 'online' || member.presence?.status === 'idle');
            if (availableStaff.size === 0) {
                const assigneeId = requestedBy;
                const { TicketManager } = await Promise.resolve().then(() => __importStar(require('./index')));
                const ticketManager = new TicketManager(this.bot);
                return await ticketManager.assignTicket(ticketId, assigneeId, requestedBy);
            }
            const randomStaff = availableStaff.map(member => member)[Math.floor(Math.random() * availableStaff.size)];
            const { TicketManager } = await Promise.resolve().then(() => __importStar(require('./index')));
            const ticketManager = new TicketManager(this.bot);
            return await ticketManager.assignTicket(ticketId, randomStaff.id, requestedBy);
        }
        catch (error) {
            this.logger.error('Failed to auto-assign by service:', error);
            return false;
        }
    }
    async requestManualAssignment(ticketId, requestedBy) {
        try {
            if (!this.bot.channelManager)
                return false;
            const assignmentEmbed = embed_1.EmbedManager.createInfoEmbed('Manual Assignment Required', `<@${requestedBy}> has requested manual assignment for ticket ${ticketId}. Please use the ticket assignment command to assign this ticket to a specific staff member.`);
            await this.bot.channelManager.sendLog('ticketRequests', assignmentEmbed);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to request manual assignment:', error);
            return false;
        }
    }
    getServiceRoleId(service) {
        switch (service) {
            case ticket_1.ServiceType.GAME:
                return config_1.config.roles.gameServiceStaff;
            case ticket_1.ServiceType.DISCORD:
                return config_1.config.roles.discordServiceStaff;
            case ticket_1.ServiceType.MINECRAFT:
                return config_1.config.roles.minecraftServiceStaff;
            default:
                return null;
        }
    }
    async getTicketUser(ticketId) {
        return null;
    }
}
exports.TicketApprovalManager = TicketApprovalManager;
//# sourceMappingURL=approval.js.map