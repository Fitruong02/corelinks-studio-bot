"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertScheduler = void 0;
const logger_1 = require("@utils/logger");
class AlertScheduler {
    bot;
    logger;
    alertManager;
    scheduledAlerts = new Map();
    constructor(bot, alertManager) {
        this.bot = bot;
        this.logger = new logger_1.Logger('AlertScheduler');
        this.alertManager = alertManager;
    }
    async scheduleAlert(alertData) {
        try {
            const delay = alertData.triggerAt.getTime() - Date.now();
            if (delay <= 0) {
                await this.alertManager.triggerAlert(alertData.id);
                return;
            }
            const timeout = setTimeout(async () => {
                await this.alertManager.triggerAlert(alertData.id);
                this.scheduledAlerts.delete(alertData.id);
            }, delay);
            this.scheduledAlerts.set(alertData.id, timeout);
            this.logger.debug(`Scheduled alert ${alertData.id} for ${alertData.triggerAt}`);
        }
        catch (error) {
            this.logger.error('Failed to schedule alert:', error);
        }
    }
    async cancelAlert(alertId) {
        try {
            const timeout = this.scheduledAlerts.get(alertId);
            if (timeout) {
                clearTimeout(timeout);
                this.scheduledAlerts.delete(alertId);
                this.logger.debug(`Cancelled scheduled alert ${alertId}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to cancel scheduled alert:', error);
        }
    }
    async rescheduleAll() {
        try {
            for (const timeout of this.scheduledAlerts.values()) {
                clearTimeout(timeout);
            }
            this.scheduledAlerts.clear();
            const activeAlerts = await this.alertManager.getAllActiveAlerts();
            for (const alert of activeAlerts) {
                await this.scheduleAlert(alert);
            }
            this.logger.info(`Rescheduled ${activeAlerts.length} alerts`);
        }
        catch (error) {
            this.logger.error('Failed to reschedule alerts:', error);
        }
    }
    getScheduledCount() {
        return this.scheduledAlerts.size;
    }
}
exports.AlertScheduler = AlertScheduler;
//# sourceMappingURL=scheduler.js.map