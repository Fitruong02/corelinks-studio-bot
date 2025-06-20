import { CorelinksBot } from '../../bot';
export declare class ChannelLogger {
    private bot;
    private logger;
    constructor(bot: CorelinksBot);
    logToChannel(channelName: string, embed: any): Promise<boolean>;
    createLogMessage(title: string, description: string, fields?: any[]): Promise<any>;
    logCustomEvent(channelName: string, eventName: string, details: Record<string, any>): Promise<void>;
    logError(error: Error, context: string): Promise<void>;
}
//# sourceMappingURL=channels.d.ts.map