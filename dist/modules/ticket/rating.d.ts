import { CorelinksBot } from '../../bot';
import { TicketData } from '../../types/ticket';
export declare class TicketRatingManager {
    private bot;
    private logger;
    private pendingRatings;
    constructor(bot: CorelinksBot);
    requestRating(ticket: TicketData): Promise<void>;
    handleRatingSubmission(userId: string, ticketId: string, rating: number): Promise<void>;
    handleRatingSkip(userId: string, ticketId: string): Promise<void>;
    private requestDetailedFeedback;
    getAverageRating(staffId?: string, days?: number): Promise<number>;
    getRatingStats(days?: number): Promise<{
        total: number;
        average: number;
        distribution: number[];
    }>;
    isPendingRating(userId: string): boolean;
    getPendingRating(userId: string): TicketData | null;
}
//# sourceMappingURL=rating.d.ts.map