"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsManager = void 0;
const logger_1 = require("@utils/logger");
const helpers_1 = require("@utils/helpers");
const sheets_1 = require("./sheets");
const reports_1 = require("./reports");
const Analytics_1 = require("@database/models/Analytics");
class AnalyticsManager {
    bot;
    logger;
    sheetsManager;
    reportManager;
    weeklyReportScheduled = false;
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('AnalyticsManager');
        this.sheetsManager = new sheets_1.GoogleSheetsManager(bot);
        this.reportManager = new reports_1.ReportManager(bot, this.sheetsManager);
        this.scheduleWeeklyReports();
    }
    async recordTicketCreated() {
        try {
            await Analytics_1.AnalyticsModel.updateCurrentWeekTickets(1);
            this.logger.debug('Recorded ticket creation in analytics');
        }
        catch (error) {
            this.logger.error('Failed to record ticket creation:', error);
        }
    }
    async recordRevenue(amount) {
        try {
            await Analytics_1.AnalyticsModel.updateCurrentWeekRevenue(amount);
            this.logger.debug(`Recorded revenue: ${amount} VND`);
        }
        catch (error) {
            this.logger.error('Failed to record revenue:', error);
        }
    }
    async recordRating(rating) {
        try {
            const currentWeek = await Analytics_1.AnalyticsModel.getCurrentWeekData();
            if (currentWeek) {
                const newAvg = (currentWeek.satisfactionAvg + rating) / 2;
                await Analytics_1.AnalyticsModel.createWeeklyRecord(helpers_1.HelperUtils.getWeekStart(), {
                    ...currentWeek,
                    satisfactionAvg: newAvg
                });
            }
            else {
                await Analytics_1.AnalyticsModel.createWeeklyRecord(helpers_1.HelperUtils.getWeekStart(), {
                    satisfactionAvg: rating,
                    ticketCount: 0,
                    revenue: 0,
                    memberGrowth: 0
                });
            }
            this.logger.debug(`Recorded rating: ${rating} stars`);
        }
        catch (error) {
            this.logger.error('Failed to record rating:', error);
        }
    }
    async recordMemberGrowth(change) {
        try {
            const currentWeek = await Analytics_1.AnalyticsModel.getCurrentWeekData();
            const currentGrowth = currentWeek?.memberGrowth || 0;
            await Analytics_1.AnalyticsModel.createWeeklyRecord(helpers_1.HelperUtils.getWeekStart(), {
                memberGrowth: currentGrowth + change,
                ticketCount: currentWeek?.ticketCount || 0,
                revenue: currentWeek?.revenue || 0,
                satisfactionAvg: currentWeek?.satisfactionAvg || 0
            });
            this.logger.debug(`Recorded member growth: ${change > 0 ? '+' : ''}${change}`);
        }
        catch (error) {
            this.logger.error('Failed to record member growth:', error);
        }
    }
    async generateWeeklyReport() {
        try {
            return await this.reportManager.generateWeeklyReport();
        }
        catch (error) {
            this.logger.error('Failed to generate weekly report:', error);
            return false;
        }
    }
    async getAnalyticsSummary(weeks = 4) {
        try {
            const recentWeeks = await Analytics_1.AnalyticsModel.getRecentWeeks(weeks);
            const summary = {
                totalTickets: recentWeeks.reduce((sum, week) => sum + week.ticketCount, 0),
                totalRevenue: recentWeeks.reduce((sum, week) => sum + week.revenue, 0),
                averageSatisfaction: recentWeeks.length > 0
                    ? recentWeeks.reduce((sum, week) => sum + week.satisfactionAvg, 0) / recentWeeks.length
                    : 0,
                memberGrowth: recentWeeks.reduce((sum, week) => sum + week.memberGrowth, 0),
                weeksAnalyzed: recentWeeks.length
            };
            return summary;
        }
        catch (error) {
            this.logger.error('Failed to get analytics summary:', error);
            return {
                totalTickets: 0,
                totalRevenue: 0,
                averageSatisfaction: 0,
                memberGrowth: 0,
                weeksAnalyzed: 0
            };
        }
    }
    async exportToSheets(data, sheetName) {
        try {
            return await this.sheetsManager.appendData(sheetName, data);
        }
        catch (error) {
            this.logger.error('Failed to export to sheets:', error);
            return false;
        }
    }
    scheduleWeeklyReports() {
        if (this.weeklyReportScheduled)
            return;
        const now = new Date();
        const nextMonday = new Date(now);
        nextMonday.setDate(now.getDate() + (1 + 7 - now.getDay()) % 7);
        nextMonday.setHours(9, 0, 0, 0);
        const timeUntilNextMonday = nextMonday.getTime() - now.getTime();
        setTimeout(() => {
            this.generateWeeklyReport();
            setInterval(() => {
                this.generateWeeklyReport();
            }, 7 * 24 * 60 * 60 * 1000);
        }, timeUntilNextMonday);
        this.weeklyReportScheduled = true;
        this.logger.info(`Scheduled weekly reports starting ${nextMonday.toISOString()}`);
    }
    getSheetsManager() {
        return this.sheetsManager;
    }
    getReportManager() {
        return this.reportManager;
    }
}
exports.AnalyticsManager = AnalyticsManager;
//# sourceMappingURL=index.js.map