import { AnalyticsWeekly } from '../../types/database';
export declare class AnalyticsModel {
    private static logger;
    static createWeeklyRecord(weekStart: Date, data: Partial<AnalyticsWeekly>): Promise<boolean>;
    static getWeeklyData(weekStart: Date): Promise<AnalyticsWeekly | null>;
    static getCurrentWeekData(): Promise<AnalyticsWeekly | null>;
    static getRecentWeeks(weeksCount?: number): Promise<AnalyticsWeekly[]>;
    static updateCurrentWeekTickets(increment?: number): Promise<boolean>;
    static updateCurrentWeekRevenue(amount: number): Promise<boolean>;
}
//# sourceMappingURL=Analytics.d.ts.map