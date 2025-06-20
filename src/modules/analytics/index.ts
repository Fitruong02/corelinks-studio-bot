// ===== src/modules/analytics/index.ts =====
import { CorelinksBot } from '../../bot';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';
import { HelperUtils } from '@utils/helpers';
import { GoogleSheetsManager } from './sheets';
import { ReportManager } from './reports';
import { AnalyticsModel } from '@database/models/Analytics';

export class AnalyticsManager {
  private bot: CorelinksBot;
  private logger: Logger;
  private sheetsManager: GoogleSheetsManager;
  private reportManager: ReportManager;
  private weeklyReportScheduled: boolean = false;

  constructor(bot: CorelinksBot) {
    this.bot = bot;
    this.logger = new Logger('AnalyticsManager');
    this.sheetsManager = new GoogleSheetsManager(bot);
    this.reportManager = new ReportManager(bot, this.sheetsManager);
    
    // Schedule weekly reports
    this.scheduleWeeklyReports();
  }

  async recordTicketCreated(): Promise<void> {
    try {
      await AnalyticsModel.updateCurrentWeekTickets(1);
      this.logger.debug('Recorded ticket creation in analytics');
    } catch (error) {
      this.logger.error('Failed to record ticket creation:', error);
    }
  }

  async recordRevenue(amount: number): Promise<void> {
    try {
      await AnalyticsModel.updateCurrentWeekRevenue(amount);
      this.logger.debug(`Recorded revenue: ${amount} VND`);
    } catch (error) {
      this.logger.error('Failed to record revenue:', error);
    }
  }

  async recordRating(rating: number): Promise<void> {
    try {
      // Update satisfaction average (this would need more complex calculation in real implementation)
      const currentWeek = await AnalyticsModel.getCurrentWeekData();
      if (currentWeek) {
        // Simple average calculation - in production you'd want to track all ratings
        const newAvg = (currentWeek.satisfactionAvg + rating) / 2;
        await AnalyticsModel.createWeeklyRecord(HelperUtils.getWeekStart(), {
          ...currentWeek,
          satisfactionAvg: newAvg
        });
      } else {
        await AnalyticsModel.createWeeklyRecord(HelperUtils.getWeekStart(), {
          satisfactionAvg: rating,
          ticketCount: 0,
          revenue: 0,
          memberGrowth: 0
        });
      }
      
      this.logger.debug(`Recorded rating: ${rating} stars`);
    } catch (error) {
      this.logger.error('Failed to record rating:', error);
    }
  }

  async recordMemberGrowth(change: number): Promise<void> {
    try {
      const currentWeek = await AnalyticsModel.getCurrentWeekData();
      const currentGrowth = currentWeek?.memberGrowth || 0;
      
      await AnalyticsModel.createWeeklyRecord(HelperUtils.getWeekStart(), {
        memberGrowth: currentGrowth + change,
        ticketCount: currentWeek?.ticketCount || 0,
        revenue: currentWeek?.revenue || 0,
        satisfactionAvg: currentWeek?.satisfactionAvg || 0
      });
      
      this.logger.debug(`Recorded member growth: ${change > 0 ? '+' : ''}${change}`);
    } catch (error) {
      this.logger.error('Failed to record member growth:', error);
    }
  }

  async generateWeeklyReport(): Promise<boolean> {
    try {
      return await this.reportManager.generateWeeklyReport();
    } catch (error) {
      this.logger.error('Failed to generate weekly report:', error);
      return false;
    }
  }

  async getAnalyticsSummary(weeks: number = 4): Promise<AnalyticsSummary> {
    try {
      const recentWeeks = await AnalyticsModel.getRecentWeeks(weeks);
      
      const summary: AnalyticsSummary = {
        totalTickets: recentWeeks.reduce((sum, week) => sum + week.ticketCount, 0),
        totalRevenue: recentWeeks.reduce((sum, week) => sum + week.revenue, 0),
        averageSatisfaction: recentWeeks.length > 0 
          ? recentWeeks.reduce((sum, week) => sum + week.satisfactionAvg, 0) / recentWeeks.length 
          : 0,
        memberGrowth: recentWeeks.reduce((sum, week) => sum + week.memberGrowth, 0),
        weeksAnalyzed: recentWeeks.length
      };

      return summary;
    } catch (error) {
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

  async exportToSheets(data: any, sheetName: string): Promise<boolean> {
    try {
      return await this.sheetsManager.appendData(sheetName, data);
    } catch (error) {
      this.logger.error('Failed to export to sheets:', error);
      return false;
    }
  }

  private scheduleWeeklyReports(): void {
    if (this.weeklyReportScheduled) return;

    // Schedule for every Monday at 9 AM
    const now = new Date();
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + (1 + 7 - now.getDay()) % 7);
    nextMonday.setHours(9, 0, 0, 0);

    const timeUntilNextMonday = nextMonday.getTime() - now.getTime();

    setTimeout(() => {
      this.generateWeeklyReport();
      
      // Schedule recurring weekly reports
      setInterval(() => {
        this.generateWeeklyReport();
      }, 7 * 24 * 60 * 60 * 1000); // Every week
      
    }, timeUntilNextMonday);

    this.weeklyReportScheduled = true;
    this.logger.info(`Scheduled weekly reports starting ${nextMonday.toISOString()}`);
  }

  public getSheetsManager(): GoogleSheetsManager {
    return this.sheetsManager;
  }

  public getReportManager(): ReportManager {
    return this.reportManager;
  }
}

interface AnalyticsSummary {
  totalTickets: number;
  totalRevenue: number;
  averageSatisfaction: number;
  memberGrowth: number;
  weeksAnalyzed: number;
}