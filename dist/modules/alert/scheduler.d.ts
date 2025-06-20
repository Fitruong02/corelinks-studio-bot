import { CorelinksBot } from '../../bot';
import { AlertManager } from './index';
export declare class AlertScheduler {
    private bot;
    private logger;
    private alertManager;
    private scheduledAlerts;
    constructor(bot: CorelinksBot, alertManager: AlertManager);
    scheduleAlert(alertData: any): Promise<void>;
    cancelAlert(alertId: string): Promise<void>;
    rescheduleAll(): Promise<void>;
    getScheduledCount(): number;
}
//# sourceMappingURL=scheduler.d.ts.map