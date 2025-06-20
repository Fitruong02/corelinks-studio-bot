// ===== src/database/models/Analytics.ts =====
import { database } from '@config/database';
import { AnalyticsWeekly } from '../../types/database';
import { Logger } from '@utils/logger';
import { HelperUtils } from '@utils/helpers';

export class AnalyticsModel {
  private static logger = new Logger('AnalyticsModel');

  static async createWeeklyRecord(weekStart: Date, data: Partial<AnalyticsWeekly>): Promise<boolean> {
    try {
      await database.execute(
        `INSERT INTO analytics_weekly (week_start, ticket_count, revenue, satisfaction_avg, member_growth) 
         VALUES (?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
         ticket_count = VALUES(ticket_count),
         revenue = VALUES(revenue),
         satisfaction_avg = VALUES(satisfaction_avg),
         member_growth = VALUES(member_growth)`,
        [
          weekStart.toISOString().split('T')[0],
          data.ticketCount || 0,
          data.revenue || 0,
          data.satisfactionAvg || 0,
          data.memberGrowth || 0
        ]
      );
      
      this.logger.info(`Created/updated weekly analytics for ${weekStart.toISOString().split('T')[0]}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to create weekly analytics record:', error);
      return false;
    }
  }

  static async getWeeklyData(weekStart: Date): Promise<AnalyticsWeekly | null> {
    try {
      const results = await database.query(
        'SELECT * FROM analytics_weekly WHERE week_start = ?',
        [weekStart.toISOString().split('T')[0]]
      );
      
      if (results.length === 0) return null;
      
      const row = results[0];
      return {
        id: row.id,
        weekStart: new Date(row.week_start),
        ticketCount: row.ticket_count,
        revenue: parseFloat(row.revenue),
        satisfactionAvg: parseFloat(row.satisfaction_avg),
        memberGrowth: row.member_growth,
        createdAt: row.created_at
      };
    } catch (error) {
      this.logger.error('Failed to get weekly analytics data:', error);
      return null;
    }
  }

  static async getCurrentWeekData(): Promise<AnalyticsWeekly | null> {
    const currentWeekStart = HelperUtils.getWeekStart();
    return this.getWeeklyData(currentWeekStart);
  }

  static async getRecentWeeks(weeksCount: number = 4): Promise<AnalyticsWeekly[]> {
    try {
      const results = await database.query(
        'SELECT * FROM analytics_weekly ORDER BY week_start DESC LIMIT ?',
        [weeksCount]
      );
      
      return results.map((row: any) => ({
        id: row.id,
        weekStart: new Date(row.week_start),
        ticketCount: row.ticket_count,
        revenue: parseFloat(row.revenue),
        satisfactionAvg: parseFloat(row.satisfaction_avg),
        memberGrowth: row.member_growth,
        createdAt: row.created_at
      }));
    } catch (error) {
      this.logger.error('Failed to get recent weeks analytics:', error);
      return [];
    }
  }

  static async updateCurrentWeekTickets(increment: number = 1): Promise<boolean> {
    try {
      const weekStart = HelperUtils.getWeekStart();
      await database.execute(
        `INSERT INTO analytics_weekly (week_start, ticket_count) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE ticket_count = ticket_count + ?`,
        [weekStart.toISOString().split('T')[0], increment, increment]
      );
      
      return true;
    } catch (error) {
      this.logger.error('Failed to update current week tickets:', error);
      return false;
    }
  }

  static async updateCurrentWeekRevenue(amount: number): Promise<boolean> {
    try {
      const weekStart = HelperUtils.getWeekStart();
      await database.execute(
        `INSERT INTO analytics_weekly (week_start, revenue) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE revenue = revenue + ?`,
        [weekStart.toISOString().split('T')[0], amount, amount]
      );
      
      return true;
    } catch (error) {
      this.logger.error('Failed to update current week revenue:', error);
      return false;
    }
  }
}