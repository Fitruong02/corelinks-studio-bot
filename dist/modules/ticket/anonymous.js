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
exports.AnonymousManager = void 0;
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
const helpers_1 = require("@utils/helpers");
class AnonymousManager {
    bot;
    logger;
    anonymousChannels = new Map();
    dmProxies = new Map();
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('AnonymousManager');
    }
    async setupAnonymousChannel(ticket, channelId) {
        try {
            this.anonymousChannels.set(ticket.ticketId, channelId);
            this.dmProxies.set(ticket.userId, ticket.ticketId);
            const user = await this.bot.client.users.fetch(ticket.userId);
            if (user) {
                const instructionEmbed = embed_1.EmbedManager.createInfoEmbed('Anonymous Communication Setup', `Your ticket ${ticket.ticketId} is now active. All messages you send here will be forwarded anonymously to our support team.\n\n**Important:**\n• Your identity remains hidden as ${ticket.customerId}\n• Only reply to this DM to communicate with support\n• Type "status" to check your ticket status\n• Type "close" to close your ticket`);
                await helpers_1.HelperUtils.safeDMSend(user, instructionEmbed);
            }
            this.logger.info(`Anonymous communication setup for ticket ${ticket.ticketId}`);
        }
        catch (error) {
            this.logger.error('Failed to setup anonymous channel:', error);
        }
    }
    async handleCustomerDM(message) {
        try {
            const userId = message.author.id;
            const ticketId = this.dmProxies.get(userId);
            if (!ticketId) {
                return;
            }
            const content = message.content.toLowerCase().trim();
            if (content === 'status') {
                await this.sendTicketStatus(message.author);
                return;
            }
            if (content === 'close') {
                await this.handleCustomerClose(ticketId, userId);
                return;
            }
            await this.forwardMessageToStaff(ticketId, message);
        }
        catch (error) {
            this.logger.error('Error handling customer DM:', error);
        }
    }
    async handleStaffMessage(message, ticketId) {
        try {
            const ticket = await this.getTicketData(ticketId);
            if (!ticket)
                return;
            await this.forwardMessageToCustomer(ticket, message);
        }
        catch (error) {
            this.logger.error('Error handling staff message:', error);
        }
    }
    async forwardMessageToStaff(ticketId, customerMessage) {
        try {
            const channelId = this.anonymousChannels.get(ticketId);
            if (!channelId)
                return;
            const channel = await this.bot.client.channels.fetch(channelId);
            if (!channel ||
                !channel.isTextBased() ||
                channel.type === 3)
                return;
            const ticket = await this.getTicketData(ticketId);
            if (!ticket)
                return;
            const messageEmbed = embed_1.EmbedManager.createInfoEmbed(`Message from ${ticket.customerId}`, customerMessage.content);
            messageEmbed.setTimestamp(customerMessage.createdAt);
            if (customerMessage.attachments.size > 0) {
                const attachmentUrls = Array.from(customerMessage.attachments.values())
                    .map(attachment => {
                    const att = attachment;
                    return `[${att.name}](${att.url})`;
                })
                    .join('\n');
                messageEmbed.addFields({
                    name: 'Attachments',
                    value: attachmentUrls,
                    inline: false
                });
            }
            if ('send' in channel && typeof channel.send === 'function') {
                await channel.send({ embeds: [messageEmbed] });
            }
            if (this.bot.channelManager) {
                const logEmbed = embed_1.EmbedManager.createLogEmbed('Anonymous Message', `Customer ${ticket.customerId} sent message in ticket ${ticketId}`, [
                    { name: 'Message Length', value: customerMessage.content.length.toString(), inline: true },
                    { name: 'Attachments', value: customerMessage.attachments.size.toString(), inline: true }
                ]);
                await this.bot.channelManager.sendLog('ticketLogs', logEmbed);
            }
        }
        catch (error) {
            this.logger.error('Failed to forward message to staff:', error);
        }
    }
    async forwardMessageToCustomer(ticket, staffMessage) {
        try {
            const user = await this.bot.client.users.fetch(ticket.userId);
            if (!user)
                return;
            const staffMember = await this.bot.client.users.fetch(staffMessage.author.id);
            const responseEmbed = embed_1.EmbedManager.createInfoEmbed(`Response for Ticket ${ticket.ticketId}`, staffMessage.content);
            responseEmbed.setFooter({
                text: `Support Team Member • ${new Date().toLocaleString('vi-VN')}`,
                iconURL: staffMember?.displayAvatarURL()
            });
            if (staffMessage.attachments.size > 0) {
                const attachmentUrls = Array.from(staffMessage.attachments.values())
                    .map(attachment => {
                    const att = attachment;
                    return `[${att.name}](${att.url})`;
                })
                    .join('\n');
                responseEmbed.addFields({
                    name: 'Files',
                    value: attachmentUrls,
                    inline: false
                });
            }
            await helpers_1.HelperUtils.safeDMSend(user, responseEmbed);
        }
        catch (error) {
            this.logger.error('Failed to forward message to customer:', error);
        }
    }
    async sendTicketStatus(user) {
        try {
            const ticketId = this.dmProxies.get(user.id);
            if (!ticketId)
                return;
            const ticket = await this.getTicketData(ticketId);
            if (!ticket)
                return;
            const statusEmbed = embed_1.EmbedManager.createInfoEmbed('Ticket Status', `Here is the current status of your ticket:`);
            statusEmbed.addFields({ name: 'Ticket ID', value: ticket.ticketId, inline: true }, { name: 'Customer ID', value: ticket.customerId, inline: true }, { name: 'Service', value: ticket.service, inline: true }, { name: 'Status', value: ticket.status.toUpperCase(), inline: true }, { name: 'Created', value: helpers_1.HelperUtils.formatRelativeTime(ticket.createdAt), inline: true }, { name: 'Last Activity', value: helpers_1.HelperUtils.formatRelativeTime(ticket.lastActivity), inline: true });
            if (ticket.assignedStaff) {
                const staff = await this.bot.client.users.fetch(ticket.assignedStaff);
                statusEmbed.addFields({
                    name: 'Assigned Staff',
                    value: staff ? staff.username : 'Unknown',
                    inline: true
                });
            }
            await helpers_1.HelperUtils.safeDMSend(user, statusEmbed);
        }
        catch (error) {
            this.logger.error('Failed to send ticket status:', error);
        }
    }
    async handleCustomerClose(ticketId, userId) {
        try {
            const { TicketManager } = await Promise.resolve().then(() => __importStar(require('./index')));
            const ticketManager = new TicketManager(this.bot);
            const closed = await ticketManager.closeTicket(ticketId, userId, 'Closed by customer');
            const user = await this.bot.client.users.fetch(userId);
            if (user) {
                if (closed) {
                    const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Ticket Closed', 'Your ticket has been closed successfully. Thank you for using our support service!');
                    await helpers_1.HelperUtils.safeDMSend(user, successEmbed);
                }
                else {
                    const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Close Failed', 'Failed to close your ticket. Please contact support directly.');
                    await helpers_1.HelperUtils.safeDMSend(user, errorEmbed);
                }
            }
            this.dmProxies.delete(userId);
            this.anonymousChannels.delete(ticketId);
        }
        catch (error) {
            this.logger.error('Failed to handle customer close:', error);
        }
    }
    async getTicketData(ticketId) {
        return null;
    }
    removeAnonymousMapping(ticketId) {
        const channelId = this.anonymousChannels.get(ticketId);
        this.anonymousChannels.delete(ticketId);
        for (const [userId, tId] of this.dmProxies.entries()) {
            if (tId === ticketId) {
                this.dmProxies.delete(userId);
                break;
            }
        }
        this.logger.info(`Removed anonymous mapping for ticket ${ticketId}`);
    }
    isAnonymousChannel(channelId) {
        return Array.from(this.anonymousChannels.values()).includes(channelId);
    }
    getTicketFromChannel(channelId) {
        for (const [ticketId, chId] of this.anonymousChannels.entries()) {
            if (chId === channelId) {
                return ticketId;
            }
        }
        return null;
    }
}
exports.AnonymousManager = AnonymousManager;
//# sourceMappingURL=anonymous.js.map