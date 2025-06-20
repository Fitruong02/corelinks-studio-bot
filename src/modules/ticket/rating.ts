import { CorelinksBot } from '../../bot';
import { TicketData, TicketRating } from '../../types/ticket';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';
import { HelperUtils } from '@utils/helpers';
import { BackupModel } from '@database/models/Backup';
import { BackupType } from '../../types/database'; 

export class TicketRatingManager {
  private bot: CorelinksBot;
  private logger: Logger;
  private pendingRatings: Map<string, TicketData> = new Map(); // userId -> ticketData

  constructor(bot: CorelinksBot) {
    this.bot = bot;
    this.logger = new Logger('TicketRatingManager');
  }

  async requestRating(ticket: TicketData): Promise<void> {
    try {
      const user = await this.bot.client.users.fetch(ticket.userId);
      if (!user) return;

      // Store ticket for rating completion
      this.pendingRatings.set(ticket.userId, ticket);

      const ratingEmbed = EmbedManager.createInfoEmbed(
        'Rate Your Support Experience',
        `Thank you for using our support service! Your ticket ${ticket.ticketId} has been resolved.\n\nPlease take a moment to rate your experience with our support team. Your feedback helps us improve our service quality.`
      );

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

      await HelperUtils.safeDMSend(user, {
        embeds: [ratingEmbed],
        components: [ratingRow, skipRow]
      });

      this.logger.info(`Sent rating request for ticket ${ticket.ticketId}`);

      // Auto-remove from pending after 24 hours
      setTimeout(() => {
        this.pendingRatings.delete(ticket.userId);
      }, 86400000); // 24 hours

    } catch (error) {
      this.logger.error('Failed to request rating:', error);
    }
  }

  async handleRatingSubmission(userId: string, ticketId: string, rating: number): Promise<void> {
    try {
      const ticket = this.pendingRatings.get(userId);
      if (!ticket || ticket.ticketId !== ticketId) {
        this.logger.warn(`Invalid rating submission for ticket ${ticketId} by user ${userId}`);
        return;
      }

      // Create rating record
      const ratingData: TicketRating = {
        ticketId,
        customerId: ticket.customerId,
        rating,
        staffId: ticket.assignedStaff,
        timestamp: new Date()
      };

      // Store rating in backup system
      await BackupModel.create(BackupType.USER_RATINGS, ratingData);

      // Send thank you message
      const user = await this.bot.client.users.fetch(userId);
      if (user) {
        const thankYouEmbed = EmbedManager.createSuccessEmbed(
          'Thank You for Your Feedback!',
          `Your ${rating}-star rating has been recorded. We appreciate your feedback and will use it to improve our support service.`
        );

        if (rating <= 3) {
          thankYouEmbed.addFields({
            name: 'We Want to Do Better',
            value: 'We notice you had a less than perfect experience. If you have specific feedback on how we can improve, please feel free to create another ticket.',
            inline: false
          });
        }

        await HelperUtils.safeDMSend(user, thankYouEmbed);
      }

      // Log rating for staff awareness
      if (this.bot.channelManager) {
        const ratingLogEmbed = EmbedManager.createLogEmbed(
          'Customer Rating Submitted',
          `Ticket ${ticketId} received a ${rating}-star rating`,
          [
            { name: 'Customer ID', value: ticket.customerId, inline: true },
            { name: 'Service', value: ticket.service, inline: true },
            { name: 'Assigned Staff', value: ticket.assignedStaff ? `<@${ticket.assignedStaff}>` : 'None', inline: true }
          ]
        );

        // Set color based on rating
        if (rating >= 4) {
          ratingLogEmbed.setColor('#00ff00'); // Green for good ratings
        } else if (rating === 3) {
          ratingLogEmbed.setColor('#ffff00'); // Yellow for neutral
        } else {
          ratingLogEmbed.setColor('#ff0000'); // Red for poor ratings
        }

        await this.bot.channelManager.sendLog('ticketLogs', ratingLogEmbed);
      }

      // Remove from pending
      this.pendingRatings.delete(userId);

      this.logger.info(`Rating ${rating} submitted for ticket ${ticketId}`);

      // Request feedback for low ratings
      if (rating <= 3) {
        await this.requestDetailedFeedback(user, ticket, rating);
      }

    } catch (error) {
      this.logger.error('Failed to handle rating submission:', error);
    }
  }

  async handleRatingSkip(userId: string, ticketId: string): Promise<void> {
    try {
      const ticket = this.pendingRatings.get(userId);
      if (!ticket || ticket.ticketId !== ticketId) {
        return;
      }

      const user = await this.bot.client.users.fetch(userId);
      if (user) {
        const skipEmbed = EmbedManager.createInfoEmbed(
          'Rating Skipped',
          'No problem! Thank you for using our support service. Feel free to reach out again if you need assistance.'
        );

        await HelperUtils.safeDMSend(user, skipEmbed);
      }

      // Remove from pending
      this.pendingRatings.delete(userId);

      this.logger.info(`Rating skipped for ticket ${ticketId}`);

    } catch (error) {
      this.logger.error('Failed to handle rating skip:', error);
    }
  }

  private async requestDetailedFeedback(user: any, ticket: TicketData, rating: number): Promise<void> {
    try {
      const feedbackEmbed = EmbedManager.createInfoEmbed(
        'Help Us Improve',
        `We're sorry your experience wasn't perfect. Would you mind sharing what went wrong so we can improve our service?\n\nYou can reply to this message with your feedback, or simply ignore this if you prefer not to share details.`
      );

      await HelperUtils.safeDMSend(user, feedbackEmbed);

      // Set up temporary listener for feedback (would be implemented with message handling)
      this.logger.info(`Requested detailed feedback for low rating on ticket ${ticket.ticketId}`);

    } catch (error) {
      this.logger.error('Failed to request detailed feedback:', error);
    }
  }

  async getAverageRating(staffId?: string, days?: number): Promise<number> {
    try {
      // This would query the backup system for ratings
      // Implementation would filter by staffId and date range if provided
      
      // Placeholder implementation
      return 4.2; // Would calculate from actual data
    } catch (error) {
      this.logger.error('Failed to get average rating:', error);
      return 0;
    }
  }

  async getRatingStats(days: number = 30): Promise<{ total: number; average: number; distribution: number[] }> {
    try {
      // This would analyze ratings from the backup system
      // Implementation would calculate stats for the specified period
      
      // Placeholder implementation
      return {
        total: 50,
        average: 4.2,
        distribution: [2, 3, 8, 15, 22] // 1-star to 5-star counts
      };
    } catch (error) {
      this.logger.error('Failed to get rating stats:', error);
      return { total: 0, average: 0, distribution: [0, 0, 0, 0, 0] };
    }
  }

  public isPendingRating(userId: string): boolean {
    return this.pendingRatings.has(userId);
  }

  public getPendingRating(userId: string): TicketData | null {
    return this.pendingRatings.get(userId) || null;
  }
}