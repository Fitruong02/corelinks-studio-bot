import { CorelinksBot } from '../../bot';
import { VoiceState, GuildMember } from 'discord.js';
import { VoiceManager } from './index';
export declare class TempChannelManager {
    private bot;
    private logger;
    private voiceManager;
    constructor(bot: CorelinksBot, voiceManager: VoiceManager);
    createTempChannel(member: GuildMember): Promise<void>;
    handleUserJoin(voiceState: VoiceState): Promise<void>;
    handleUserLeave(voiceState: VoiceState): Promise<void>;
    transferOwnership(channelId: string, currentOwnerId: string, newOwnerId: string): Promise<boolean>;
    private findUserTempChannel;
    cleanupUserChannels(userId: string): Promise<void>;
}
export {};
//# sourceMappingURL=tempChannels.d.ts.map