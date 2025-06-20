import { TextChannel, Guild } from 'discord.js';
import { config } from '@config/config';
export declare class ChannelManager {
    private guild;
    private logger;
    private channels;
    constructor(guild: Guild);
    initializeChannels(): Promise<void>;
    getChannel(name: keyof typeof config.channels): TextChannel | null;
    sendLog(channelName: keyof typeof config.channels, content: any): Promise<void>;
    isChannelAvailable(name: keyof typeof config.channels): boolean;
    refreshChannel(name: keyof typeof config.channels): Promise<void>;
}
//# sourceMappingURL=channels.d.ts.map