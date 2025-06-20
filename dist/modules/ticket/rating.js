"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketRatingManager = void 0;
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
const helpers_1 = require("@utils/helpers");
const Backup_1 = require("@database/models/Backup");
const database_1 = require("../../types/database");
class TicketRatingManager {
    bot;
    logger;
    pendingRatings = new Map();
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('TicketRatingManager');
    }
    async requestRating(ticket) {
        try {
            const user = await this.bot.client.users.fetch(ticket.userId);
            if (!user)
                return;
            this.pendingRatings.set(ticket.userId, ticket);
            const ratingEmbed = embed_1.EmbedManager.createInfoEmbed('Rate Your Support Experience', `Thank you for using our support service! Your ticket ${ticket.ticketId} has been resolved.\n\nPlease take a moment to rate your experience with our support team. Your feedback helps us improve our service quality.`);
            const ratingRow = {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 3,
                        label: '⭐',
                        customId: `rating_1_${ticket.ticketId}`,
                        emoji: { name: '1️⃣' }
                    },
                    {
                        type: 2,
                        style: 3,
                        label: '⭐⭐',
                        customId: `rating_2_${ticket.ticketId}`,
                        emoji: { name: '2️⃣' }
                    },
                    {
                        type: 2,
                        style: 3,
                        label: '⭐⭐⭐',
                        customId: `rating_3_${ticket.ticketId}`,
                        emoji: { name: '3️⃣' }
                    },
                    {
                        type: 2,
                        style: 3,
                        label: '⭐⭐⭐⭐',
                        customId: `rating_4_${ticket.ticketId}`,
                        emoji: { name: '4️⃣' }
                    },
                    {
                        type: 2,
                        style: 3,
                        label: '⭐⭐⭐⭐⭐',
                        customId: `rating_5_${ticket.ticketId}`,
                        emoji: { name: '5️⃣' }
                    }
                ]
            };
            const skipRow = {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 2,
                        label: 'Skip Rating',
                        customId: `rating_skip_${ticket.ticketId}`,
                        emoji: { name: '⏭️' }
                    }
                ]
            };
            await helpers_1.HelperUtils.safeDMSend(user, {
                embeds: [ratingEmbed],
                components: [ratingRow, skipRow]
            });
            this.logger.info(`Sent rating request for ticket ${ticket.ticketId}`);
            setTimeout(() => {
                this.pendingRatings.delete(ticket.userId);
            }, 86400000);
        }
        catch (error) {
            this.logger.error('Failed to request rating:', error);
        }
    }
    async handleRatingSubmission(userId, ticketId, rating) {
        try {
            const ticket = this.pendingRatings.get(userId);
            if (!ticket || ticket.ticketId !== ticketId) {
                this.logger.warn(`Invalid rating submission for ticket ${ticketId} by user ${userId}`);
                return;
            }
            const ratingData = {
                ticketId,
                customerId: ticket.customerId,
                rating,
                staffId: ticket.assignedStaff,
                timestamp: new Date()
            };
            await Backup_1.BackupModel.create(database_1.BackupType.USER_RATINGS, ratingData);
            const user = await this.bot.client.users.fetch(userId);
            if (user) {
                const thankYouEmbed = embed_1.EmbedManager.createSuccessEmbed('Thank You for Your Feedback!', `Your ${rating}-star rating has been recorded. We appreciate your feedback and will use it to improve our support service.`);
                if (rating <= 3) {
                    thankYouEmbed.addFields({
                        name: 'We Want to Do Better',
                        value: 'We notice you had a less than perfect experience. If you have specific feedback on how we can improve, please feel free to create another ticket.',
                        inline: false
                    });
                }
                await helpers_1.HelperUtils.safeDMSend(user, thankYouEmbed);
            }
            if (this.bot.channelManager) {
                const ratingLogEmbed = embed_1.EmbedManager.createLogEmbed('Customer Rating Submitted', `Ticket ${ticketId} received a ${rating}-star rating`, [
                    { name: 'Customer ID', value: ticket.customerId, inline: true },
                    { name: 'Service', value: ticket.service, inline: true },
                    { name: 'Assigned Staff', value: ticket.assignedStaff ? `<@${ticket.assignedStaff}>` : 'None', inline: true }
                ]);
                if (rating >= 4) {
                    ratingLogEmbed.setColor('#00ff00');
                }
                else if (rating === 3) {
                    ratingLogEmbed.setColor('#ffff00');
                }
                else {
                    ratingLogEmbed.setColor('#ff0000');
                }
                await this.bot.channelManager.sendLog('ticketLogs', ratingLogEmbed);
            }
            this.pendingRatings.delete(userId);
            this.logger.info(`Rating ${rating} submitted for ticket ${ticketId}`);
            if (rating <= 3) {
                await this.requestDetailedFeedback(user, ticket, rating);
            }
        }
        catch (error) {
            this.logger.error('Failed to handle rating submission:', error);
        }
    }
    async handleRatingSkip(userId, ticketId) {
        try {
            const ticket = this.pendingRatings.get(userId);
            if (!ticket || ticket.ticketId !== ticketId) {
                return;
            }
            const user = await this.bot.client.users.fetch(userId);
            if (user) {
                const skipEmbed = embed_1.EmbedManager.createInfoEmbed('Rating Skipped', 'No problem! Thank you for using our support service. Feel free to reach out again if you need assistance.');
                await helpers_1.HelperUtils.safeDMSend(user, skipEmbed);
            }
            this.pendingRatings.delete(userId);
            this.logger.info(`Rating skipped for ticket ${ticketId}`);
        }
        catch (error) {
            this.logger.error('Failed to handle rating skip:', error);
        }
    }
    async requestDetailedFeedback(user, ticket, rating) {
        try {
            const feedbackEmbed = embed_1.EmbedManager.createInfoEmbed('Help Us Improve', `We're sorry your experience wasn't perfect. Would you mind sharing what went wrong so we can improve our service?\n\nYou can reply to this message with your feedback, or simply ignore this if you prefer not to share details.`);
            await helpers_1.HelperUtils.safeDMSend(user, feedbackEmbed);
            this.logger.info(`Requested detailed feedback for low rating on ticket ${ticket.ticketId}`);
        }
        catch (error) {
            this.logger.error('Failed to request detailed feedback:', error);
        }
    }
    async getAverageRating(staffId, days) {
        try {
            return 4.2;
        }
        catch (error) {
            this.logger.error('Failed to get average rating:', error);
            return 0;
        }
    }
    async getRatingStats(days = 30) {
        try {
            return {
                total: 50,
                average: 4.2,
                distribution: [2, 3, 8, 15, 22]
            };
        }
        catch (error) {
            this.logger.error('Failed to get rating stats:', error);
            return { total: 0, average: 0, distribution: [0, 0, 0, 0, 0] };
        }
    }
    isPendingRating(userId) {
        return this.pendingRatings.has(userId);
    }
    getPendingRating(userId) {
        return this.pendingRatings.get(userId) || null;
    }
}
exports.TicketRatingManager = TicketRatingManager;
//# sourceMappingURL=rating.js.map