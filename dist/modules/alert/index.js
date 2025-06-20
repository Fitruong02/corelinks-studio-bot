"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertManager = void 0;
const logger_1 = require("@utils/logger");
const scheduler_1 = require("./scheduler");
const notifications_1 = require("./notifications");
class AlertManager {
    bot;
    logger;
    scheduler;
    notificationManager;
    activeAlerts = new Map();
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('AlertManager');
        this.scheduler = new scheduler_1.AlertScheduler(bot, this);
        this.notificationManager = new notifications_1.NotificationManager(bot);
    }
    async createAlert(userId, message, delayMs, target, repeat = false) {
        try {
            const alertId = this.generateAlertId();
            const triggerAt = new Date(Date.now() + delayMs);
            const alertData = {
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
        }
        catch (error) {
            this.logger.error('Failed to create alert:', error);
            return null;
        }
    }
    async cancelAlert(alertId, userId) {
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
        }
        catch (error) {
            this.logger.error('Failed to cancel alert:', error);
            return false;
        }
    }
    async triggerAlert(alertId) {
        try {
            const alert = this.activeAlerts.get(alertId);
            if (!alert || !alert.active) {
                return;
            }
            await this.notificationManager.sendAlert(alert);
            if (alert.repeat) {
                const nextTrigger = new Date(alert.triggerAt.getTime() + 86400000);
                alert.triggerAt = nextTrigger;
                await this.scheduler.scheduleAlert(alert);
            }
            else {
                alert.active = false;
                this.activeAlerts.delete(alertId);
            }
            this.logger.info(`Triggered alert ${alertId}`);
        }
        catch (error) {
            this.logger.error('Failed to trigger alert:', error);
        }
    }
    async getUserAlerts(userId) {
        return Array.from(this.activeAlerts.values())
            .filter(alert => alert.userId === userId && alert.active)
            .sort((a, b) => a.triggerAt.getTime() - b.triggerAt.getTime());
    }
    async getAllActiveAlerts() {
        return Array.from(this.activeAlerts.values())
            .filter(alert => alert.active);
    }
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getScheduler() {
        return this.scheduler;
    }
}
exports.AlertManager = AlertManager;
//# sourceMappingURL=index.js.map