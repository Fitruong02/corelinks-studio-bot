import { CorelinksBot } from '../../bot';
import { AlertScheduler } from './scheduler';
export declare class AlertManager {
    private bot;
    private logger;
    private scheduler;
    private notificationManager;
    private activeAlerts;
    constructor(bot: CorelinksBot);
    createAlert(userId: string, message: string, delayMs: number, target: 'dm' | 'channel', repeat?: boolean): Promise<string | null>;
    cancelAlert(alertId: string, userId: string): Promise<boolean>;
    triggerAlert(alertId: string): Promise<void>;
    getUserAlerts(userId: string): Promise<AlertData[]>;
    getAllActiveAlerts(): Promise<AlertData[]>;
    private generateAlertId;
    getScheduler(): AlertScheduler;
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
export {};
//# sourceMappingURL=index.d.ts.map