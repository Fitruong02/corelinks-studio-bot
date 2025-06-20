// ===== src/modules/alert/scheduler.ts =====
import { CorelinksBot } from '../../bot';
import { Logger } from '@utils/logger';
import { AlertManager } from './index';

export class AlertScheduler {
  private bot: CorelinksBot;
  private logger: Logger;
  private alertManager: AlertManager;
  private scheduledAlerts: Map<string, NodeJS.Timeout> = new Map();

  constructor(bot: CorelinksBot, alertManager: AlertManager) {
    this.bot = bot;
    this.logger = new Logger('AlertScheduler');
    this.alertManager = alertManager;
  }

  async scheduleAlert(alertData: any): Promise<void> {
    try {
      const delay = alertData.triggerAt.getTime() - Date.now();
      
      if (delay <= 0) {
        // Alert is in the past, trigger immediately
        await this.alertManager.triggerAlert(alertData.id);
        return;
      }

      const timeout = setTimeout(async () => {
        await this.alertManager.triggerAlert(alertData.id);
        this.scheduledAlerts.delete(alertData.id);
      }, delay);

      this.scheduledAlerts.set(alertData.id, timeout);
      this.logger.debug(`Scheduled alert ${alertData.id} for ${alertData.triggerAt}`);

    } catch (error) {
      this.logger.error('Failed to schedule alert:', error);
    }
  }

  async cancelAlert(alertId: string): Promise<void> {
    try {
      const timeout = this.scheduledAlerts.get(alertId);
      if (timeout) {
        clearTimeout(timeout);
        this.scheduledAlerts.delete(alertId);
        this.logger.debug(`Cancelled scheduled alert ${alertId}`);
      }
    } catch (error) {
      this.logger.error('Failed to cancel scheduled alert:', error);
    }
  }

  async rescheduleAll(): Promise<void> {
    try {
      // Clear all existing timeouts
      for (const timeout of this.scheduledAlerts.values()) {
        clearTimeout(timeout);
      }
      this.scheduledAlerts.clear();

      // Reschedule all active alerts
      const activeAlerts = await this.alertManager.getAllActiveAlerts();
      for (const alert of activeAlerts) {
        await this.scheduleAlert(alert);
      }

      this.logger.info(`Rescheduled ${activeAlerts.length} alerts`);

    } catch (error) {
      this.logger.error('Failed to reschedule alerts:', error);
    }
  }

  public getScheduledCount(): number {
    return this.scheduledAlerts.size;
  }
}