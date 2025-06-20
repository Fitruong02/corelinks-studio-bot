import { CorelinksBot } from '../../bot';
import { GoogleSheetsManager } from './sheets';
export declare class ReportManager {
    private bot;
    private logger;
    private sheetsManager;
    constructor(bot: CorelinksBot, sheetsManager: GoogleSheetsManager);
    generateWeeklyReport(): Promise<boolean>;
    private createWeeklyReportEmbed;
    private createWeeklySummaryEmbed;
    private sendReportToFounder;
    private logWeeklyReportToSheets;
    generateCustomReport(startDate: Date, endDate: Date): Promise<any>;
    generateStaffPerformanceReport(): Promise<any>;
}
//# sourceMappingURL=reports.d.ts.map