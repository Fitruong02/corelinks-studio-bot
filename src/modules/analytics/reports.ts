// ===== src/modules/analytics/reports.ts =====
import { CorelinksBot } from '../../bot';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';
import { HelperUtils } from '@utils/helpers';
import { ValidationManager } from '@utils/validation';
import { AnalyticsModel } from '@database/models/Analytics';
import { GoogleSheetsManager } from './sheets';
import { config } from '@config/config';

export class ReportManager {
  private bot: CorelinksBot;
  private logger: Logger;
  private sheetsManager: GoogleSheetsManager;

  constructor(bot: CorelinksBot, sheetsManager: GoogleSheetsManager) {
    this.bot = bot;
    this.logger = new Logger('ReportManager');
    this.sheetsManager = sheetsManager;
  }

  async generateWeeklyReport(): Promise<boolean> {
    try {
      this.logger.info('Generating weekly report...');

      // Get current week data
      const currentWeek = await AnalyticsModel.getCurrentWeekData();
      const previousWeeks = await AnalyticsModel.getRecentWeeks(4);

      if (!currentWeek) {
        this.logger.warn('No current week data available for report');
        return false;
      }

      // Create report embed
      const reportEmbed = this.createWeeklyReportEmbed(currentWeek, previousWeeks);

      // Send to founder via DM
      await this.sendReportToFounder(reportEmbed);

      // Log to sheets
      await this.logWeeklyReportToSheets(currentWeek);

      // Send summary to alerts channel
      if (this.bot.channelManager) {
        const summaryEmbed = this.createWeeklySummaryEmbed(currentWeek);
        await this.bot.channelManager.sendLog('alerts', summaryEmbed);
      }

      this.logger.info('Weekly report generated successfully');
      return true;

    } catch (error) {
      this.logger.error('Failed to generate weekly report:', error);
      return false;
    }
  }

  private createWeeklyReportEmbed(currentWeek: any, previousWeeks: any[]): any {
    const reportEmbed = EmbedManager.createInfoEmbed(
      '📊 Weekly Analytics Report',
      `Weekly report for ${HelperUtils.formatTimestamp(currentWeek.weekStart)}`
    );

    reportEmbed.addFields(
      { 
        name: '🎫 Tickets Created', 
        value: currentWeek.ticketCount.toString(), 
        inline: true 
      },
      { 
        name: '💰 Revenue Generated', 
        value: ValidationManager.formatCurrency(currentWeek.revenue), 
        inline: true 
      },
      { 
        name: '⭐ Average Satisfaction', 
        value: `${currentWeek.satisfactionAvg.toFixed(1)}/5.0`, 
        inline: true 
      },
      { 
        name: '👥 Member Growth', 
        value: currentWeek.memberGrowth > 0 ? `+${currentWeek.memberGrowth}` : currentWeek.memberGrowth.toString(), 
        inline: true 
      }
    );

    // Add comparison with previous weeks if available
    if (previousWeeks.length > 1) {
      const lastWeek = previousWeeks[1]; // Index 0 is current week, 1 is last week
      const ticketChange = currentWeek.ticketCount - lastWeek.ticketCount;
      const revenueChange = currentWeek.revenue - lastWeek.revenue;

      reportEmbed.addFields({
        name: '📈 Week-over-Week Changes',
        value: [
          `Tickets: ${ticketChange > 0 ? '+' : ''}${ticketChange}`,
          `Revenue: ${ValidationManager.formatCurrency(revenueChange)}`,
          `Satisfaction: ${(currentWeek.satisfactionAvg - lastWeek.satisfactionAvg).toFixed(1)}`
        ].join('\n'),
        inline: false
      });
    }

    // Add trends over 4 weeks
    if (previousWeeks.length >= 4) {
      const avgTickets = previousWeeks.reduce((sum, week) => sum + week.ticketCount, 0) / previousWeeks.length;
      const avgRevenue = previousWeeks.reduce((sum, week) => sum + week.revenue, 0) / previousWeeks.length;
      const avgSatisfaction = previousWeeks.reduce((sum, week) => sum + week.satisfactionAvg, 0) / previousWeeks.length;

      reportEmbed.addFields({
        name: '📊 4-Week Averages',
        value: [
          `Tickets: ${avgTickets.toFixed(1)}/week`,
          `Revenue: ${ValidationManager.formatCurrency(avgRevenue)}/week`,
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

  private createWeeklySummaryEmbed(currentWeek: any): any {
    const summaryEmbed = EmbedManager.createInfoEmbed(
      '📋 Weekly Summary',
      'Key metrics for this week:'
    );

    summaryEmbed.addFields(
      { name: 'Tickets', value: currentWeek.ticketCount.toString(), inline: true },
      { name: 'Revenue', value: ValidationManager.formatCurrency(currentWeek.revenue), inline: true },
      { name: 'Rating', value: `${currentWeek.satisfactionAvg.toFixed(1)}⭐`, inline: true }
    );

    return summaryEmbed;
  }

  private async sendReportToFounder(reportEmbed: any): Promise<void> {
    try {
      const guild = this.bot.client.guilds.cache.first();
      if (!guild) return;

      const founder = await guild.members.fetch(config.roles.founder);
      if (!founder) {
        this.logger.warn('Founder not found for weekly report');
        return;
      }

      await HelperUtils.safeDMSend(founder.user, reportEmbed);
      this.logger.info('Weekly report sent to founder');

    } catch (error) {
      this.logger.error('Failed to send report to founder:', error);
    }
  }

  private async logWeeklyReportToSheets(weekData: any): Promise<void> {
    try {
      const sheetName = 'Weekly_Reports';
      
      // Ensure sheet exists
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

    } catch (error) {
      this.logger.error('Failed to log weekly report to sheets:', error);
    }
  }

  async generateCustomReport(startDate: Date, endDate: Date): Promise<any> {
    try {
      // This would generate a custom report for a specific date range
      // Implementation would query analytics data for the specified period
      
      const reportEmbed = EmbedManager.createInfoEmbed(
        '📈 Custom Analytics Report',
        `Report from ${startDate.toLocaleDateString('vi-VN')} to ${endDate.toLocaleDateString('vi-VN')}`
      );

      reportEmbed.addFields({
        name: 'Note',
        value: 'Custom date range reports are not yet implemented. Please use weekly reports for now.',
        inline: false
      });

      return reportEmbed;

    } catch (error) {
      this.logger.error('Failed to generate custom report:', error);
      return null;
    }
  }

  async generateStaffPerformanceReport(): Promise<any> {
    try {
      // This would generate a report on staff performance
      // Implementation would analyze ticket assignments, ratings, etc.
      
      const reportEmbed = EmbedManager.createInfoEmbed(
        '👨‍💼 Staff Performance Report',
        'Performance metrics for all staff members'
      );

      reportEmbed.addFields({
        name: 'Note',
        value: 'Staff performance reports are not yet implemented. Data is being collected for future analysis.',
        inline: false
      });

      return reportEmbed;

    } catch (error) {
      this.logger.error('Failed to generate staff performance report:', error);
      return null;
    }
  }
}
