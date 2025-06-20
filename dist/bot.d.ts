import { Client, Collection } from 'discord.js';
import { ChannelManager } from '@config/channels';
export declare class CorelinksBot {
    client: Client;
    commands: Collection<string, any>;
    channelManager: ChannelManager | null;
    private logger;
    private commandLoader;
    private eventLoader;
    constructor();
    initialize(): Promise<void>;
    start(): Promise<void>;
    registerSlashCommands(): Promise<void>;
    initializeChannelManager(): Promise<void>;
}
//# sourceMappingURL=bot.d.ts.map