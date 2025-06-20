// ===== src/modules/alert/index.ts =====
import { CorelinksBot } from '../../bot';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';
import { HelperUtils } from '@utils/helpers';
import { AlertScheduler } from './scheduler';
import { NotificationManager } from './notifications';

export class AlertManager {
  private bot: CorelinksBot;
  private logger: Logger;
  private scheduler: AlertScheduler;
  private notificationManager: NotificationManager;
  private activeAlerts: Map<string, AlertData> = new Map();

  constructor(bot: CorelinksBot) {
    this.bot = bot;
    this.logger = new Logger('AlertManager');
    this.scheduler = new AlertScheduler(bot, this);
    this.notificationManager = new NotificationManager(bot);
  }

  async createAlert(
    userId: string,
    message: string,
    delayMs: number,
    target: 'dm' | 'channel',
    repeat: boolean = false
  ): Promise<string | null> {
    try {
      const alertId = this.generateAlertId();
      const triggerAt = new Date(Date.now() + delayMs);

      const alertData: AlertData = {
        id: alertId,
        userId,
        message,
        triggerAt,
        target,
        repeat,
        active: true,
        createdAt: new Date()
      };

      this.activeAlerts.set(alertId, alertData);
      await this.scheduler.scheduleAlert(alertData);

      this.logger.info(`Created alert ${alertId} for user ${userId}`);
      return alertId;

    } catch (error) {
      this.logger.error('Failed to create alert:', error);
      return null;
    }
  }

  async cancelAlert(alertId: string, userId: string): Promise<boolean> {
    try {
      const alert = this.activeAlerts.get(alertId);
      if (!alert || alert.userId !== userId) {
        return false;
      }

      alert.active = false;
      this.activeAlerts.delete(alertId);
      await this.scheduler.cancelAlert(alertId);

      this.logger.info(`Cancelled alert ${alertId} for user ${userId}`);
      return true;

    } catch (error) {
      this.logger.error('Failed to cancel alert:', error);
      return false;
    }
  }

  async triggerAlert(alertId: string): Promise<void> {
    try {
      const alert = this.activeAlerts.get(alertId);
      if (!alert || !alert.active) {
        return;
      }

      await this.notificationManager.sendAlert(alert);

      // Handle repeat alerts
      if (alert.repeat) {
        const nextTrigger = new Date(alert.triggerAt.getTime() + 86400000); // +24 hours
        alert.triggerAt = nextTrigger;
        await this.scheduler.scheduleAlert(alert);
      } else {
        alert.active = false;
        this.activeAlerts.delete(alertId);
      }

      this.logger.info(`Triggered alert ${alertId}`);

    } catch (error) {
      this.logger.error('Failed to trigger alert:', error);
    }
  }

  async getUserAlerts(userId: string): Promise<AlertData[]> {
    return Array.from(this.activeAlerts.values())
      .filter(alert => alert.userId === userId && alert.active)
      .sort((a, b) => a.triggerAt.getTime() - b.triggerAt.getTime());
  }

  async getAllActiveAlerts(): Promise<AlertData[]> {
    return Array.from(this.activeAlerts.values())
      .filter(alert => alert.active);
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public getter for scheduler
  public getScheduler(): AlertScheduler {
    return this.scheduler;
  }
}

interface AlertData {
  id: string;
  userId: string;
  message: string;
  triggerAt: Date;
  target: 'dm' | 'channel';
  repeat: boolean;
  active: boolean;
  createdAt: Date;
}