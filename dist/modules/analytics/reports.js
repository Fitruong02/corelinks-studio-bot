"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportManager = void 0;
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
const helpers_1 = require("@utils/helpers");
const validation_1 = require("@utils/validation");
const Analytics_1 = require("@database/models/Analytics");
const config_1 = require("@config/config");
class ReportManager {
    bot;
    logger;
    sheetsManager;
    constructor(bot, sheetsManager) {
        this.bot = bot;
        this.logger = new logger_1.Logger('ReportManager');
        this.sheetsManager = sheetsManager;
    }
    async generateWeeklyReport() {
        try {
            this.logger.info('Generating weekly report...');
            const currentWeek = await Analytics_1.AnalyticsModel.getCurrentWeekData();
            const previousWeeks = await Analytics_1.AnalyticsModel.getRecentWeeks(4);
            if (!currentWeek) {
                this.logger.warn('No current week data available for report');
                return false;
            }
            const reportEmbed = this.createWeeklyReportEmbed(currentWeek, previousWeeks);
            await this.sendReportToFounder(reportEmbed);
            await this.logWeeklyReportToSheets(currentWeek);
            if (this.bot.channelManager) {
                const summaryEmbed = this.createWeeklySummaryEmbed(currentWeek);
                await this.bot.channelManager.sendLog('alerts', summaryEmbed);
            }
            this.logger.info('Weekly report generated successfully');
            return true;
        }
        catch (error) {
            this.logger.error('Failed to generate weekly report:', error);
            return false;
        }
    }
    createWeeklyReportEmbed(currentWeek, previousWeeks) {
        const reportEmbed = embed_1.EmbedManager.createInfoEmbed('📊 Weekly Analytics Report', `Weekly report for ${helpers_1.HelperUtils.formatTimestamp(currentWeek.weekStart)}`);
        reportEmbed.addFields({
            name: '🎫 Tickets Created',
            value: currentWeek.ticketCount.toString(),
            inline: true
        }, {
            name: '💰 Revenue Generated',
            value: validation_1.ValidationManager.formatCurrency(currentWeek.revenue),
            inline: true
        }, {
            name: '⭐ Average Satisfaction',
            value: `${currentWeek.satisfactionAvg.toFixed(1)}/5.0`,
            inline: true
        }, {
            name: '👥 Member Growth',
            value: currentWeek.memberGrowth > 0 ? `+${currentWeek.memberGrowth}` : currentWeek.memberGrowth.toString(),
            inline: true
        });
        if (previousWeeks.length > 1) {
            const lastWeek = previousWeeks[1];
            const ticketChange = currentWeek.ticketCount - lastWeek.ticketCount;
            const revenueChange = currentWeek.revenue - lastWeek.revenue;
            reportEmbed.addFields({
                name: '📈 Week-over-Week Changes',
                value: [
                    `Tickets: ${ticketChange > 0 ? '+' : ''}${ticketChange}`,
                    `Revenue: ${validation_1.ValidationManager.formatCurrency(revenueChange)}`,
                    `Satisfaction: ${(currentWeek.satisfactionAvg - lastWeek.satisfactionAvg).toFixed(1)}`
                ].join('\n'),
                inline: false
            });
        }
        if (previousWeeks.length >= 4) {
            const avgTickets = previousWeeks.reduce((sum, week) => sum + week.ticketCount, 0) / previousWeeks.length;
            const avgRevenue = previousWeeks.reduce((sum, week) => sum + week.revenue, 0) / previousWeeks.length;
            const avgSatisfaction = previousWeeks.reduce((sum, week) => sum + week.satisfactionAvg, 0) / previousWeeks.length;
            reportEmbed.addFields({
                name: '📊 4-Week Averages',
                value: [
                    `Tickets: ${avgTickets.toFixed(1)}/week`,
                    `Revenue: ${validation_1.ValidationManager.formatCurrency(avgRevenue)}/week`,
                    `Satisfaction: ${avgSatisfaction.toFixed(1)}/5.0`
                ].join('\n'),
                inline: false
            });
        }
        reportEmbed.setFooter({
            text: `Report generated at ${new Date().toLocaleString('vi-VN')} • Corelinks Studio Analytics`
        });
        return reportEmbed;
    }
    createWeeklySummaryEmbed(currentWeek) {
        const summaryEmbed = embed_1.EmbedManager.createInfoEmbed('📋 Weekly Summary', 'Key metrics for this week:');
        summaryEmbed.addFields({ name: 'Tickets', value: currentWeek.ticketCount.toString(), inline: true }, { name: 'Revenue', value: validation_1.ValidationManager.formatCurrency(currentWeek.revenue), inline: true }, { name: 'Rating', value: `${currentWeek.satisfactionAvg.toFixed(1)}⭐`, inline: true });
        return summaryEmbed;
    }
    async sendReportToFounder(reportEmbed) {
        try {
            const guild = this.bot.client.guilds.cache.first();
            if (!guild)
                return;
            const founder = await guild.members.fetch(config_1.config.roles.founder);
            if (!founder) {
                this.logger.warn('Founder not found for weekly report');
                return;
            }
            await helpers_1.HelperUtils.safeDMSend(founder.user, reportEmbed);
            this.logger.info('Weekly report sent to founder');
        }
        catch (error) {
            this.logger.error('Failed to send report to founder:', error);
        }
    }
    async logWeeklyReportToSheets(weekData) {
        try {
            const sheetName = 'Weekly_Reports';
            await this.sheetsManager.createSheet(sheetName, [
                'Week Start', 'Tickets', 'Revenue (VND)', 'Satisfaction',
                'Member Growth', 'Generated At'
            ]);
            const row = [
                weekData.weekStart.toISOString().split('T')[0],
                weekData.ticketCount,
                weekData.revenue,
                weekData.satisfactionAvg.toFixed(2),
                weekData.memberGrowth,
                new Date().toISOString()
            ];
            await this.sheetsManager.appendData(sheetName, [row]);
            this.logger.info('Weekly report logged to Google Sheets');
        }
        catch (error) {
            this.logger.error('Failed to log weekly report to sheets:', error);
        }
    }
    async generateCustomReport(startDate, endDate) {
        try {
            const reportEmbed = embed_1.EmbedManager.createInfoEmbed('📈 Custom Analytics Report', `Report from ${startDate.toLocaleDateString('vi-VN')} to ${endDate.toLocaleDateString('vi-VN')}`);
            reportEmbed.addFields({
                name: 'Note',
                value: 'Custom date range reports are not yet implemented. Please use weekly reports for now.',
                inline: false
            });
            return reportEmbed;
        }
        catch (error) {
            this.logger.error('Failed to generate custom report:', error);
            return null;
        }
    }
    async generateStaffPerformanceReport() {
        try {
            const reportEmbed = embed_1.EmbedManager.createInfoEmbed('👨‍💼 Staff Performance Report', 'Performance metrics for all staff members');
            reportEmbed.addFields({
                name: 'Note',
                value: 'Staff performance reports are not yet implemented. Data is being collected for future analysis.',
                inline: false
            });
            return reportEmbed;
        }
        catch (error) {
            this.logger.error('Failed to generate staff performance report:', error);
            return null;
        }
    }
}
exports.ReportManager = ReportManager;
//# sourceMappingURL=reports.js.map