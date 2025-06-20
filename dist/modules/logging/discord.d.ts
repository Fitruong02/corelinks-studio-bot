import { CorelinksBot } from '../../bot';
export declare class DiscordLogger {
    private bot;
    private logger;
    constructor(bot: CorelinksBot);
    logToChannel(channelName: string, embed: any): Promise<boolean>;
    createLogMessage(title: string, description: string, fields?: any[]): Promise<any>;
    logCustomEvent(channelName: string, eventName: string, details: Record<string, any>): Promise<void>;
    logError(error: Error, context: string): Promise<void>;
    logMessageEdit(oldMessage: any, newMessage: any): Promise<void>;
    logMessageDelete(message: any): Promise<void>;
    logVoiceActivity(oldState: any, newState: any): Promise<void>;
}
//# sourceMappingURL=discord.d.ts.map