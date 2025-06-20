import { CorelinksBot } from '../../bot';
export declare class NotificationManager {
    private bot;
    private logger;
    constructor(bot: CorelinksBot);
    sendAlert(alertData: any): Promise<void>;
    private sendDMAlert;
    private sendChannelAlert;
}
//# sourceMappingURL=notifications.d.ts.map