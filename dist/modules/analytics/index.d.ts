import { CorelinksBot } from '../../bot';
import { GoogleSheetsManager } from './sheets';
import { ReportManager } from './reports';
export declare class AnalyticsManager {
    private bot;
    private logger;
    private sheetsManager;
    private reportManager;
    private weeklyReportScheduled;
    constructor(bot: CorelinksBot);
    recordTicketCreated(): Promise<void>;
    recordRevenue(amount: number): Promise<void>;
    recordRating(rating: number): Promise<void>;
    recordMemberGrowth(change: number): Promise<void>;
    generateWeeklyReport(): Promise<boolean>;
    getAnalyticsSummary(weeks?: number): Promise<AnalyticsSummary>;
    exportToSheets(data: any, sheetName: string): Promise<boolean>;
    private scheduleWeeklyReports;
    getSheetsManager(): GoogleSheetsManager;
    getReportManager(): ReportManager;
}
interface AnalyticsSummary {
    totalTickets: number;
    totalRevenue: number;
    averageSatisfaction: number;
    memberGrowth: number;
    weeksAnalyzed: number;
}
export {};
//# sourceMappingURL=index.d.ts.map