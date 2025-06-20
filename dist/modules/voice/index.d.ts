import { CorelinksBot } from '../../bot';
import { VoiceState, VoiceChannel } from 'discord.js';
import { Logger } from '@utils/logger';
import { TempChannelManager } from './tempChannels';
import { VoiceControlManager } from './controls';
export declare class VoiceManager {
    bot: CorelinksBot;
    logger: Logger;
    tempChannelManager: TempChannelManager;
    controlManager: VoiceControlManager;
    tempChannels: Map<string, TempChannelData>;
    channelOwners: Map<string, string>;
    constructor(bot: CorelinksBot);
    handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<void>;
    handleButtonInteraction(interaction: any, params: string[]): Promise<void>;
    createTempChannel(owner: any, channelName?: string): Promise<VoiceChannel | null>;
    deleteTempChannel(channelId: string, reason?: string): Promise<boolean>;
    private sendChannelControlPanel;
    private logVoiceActivity;
    private startCleanupTimer;
    private cleanupInactiveChannels;
    private calculateChannelDuration;
    isTempChannel(channelId: string): boolean;
    canControlChannel(channelId: string, userId: string): boolean;
    getTempChannelData(channelId: string): TempChannelData | null;
    updateTempChannelData(channelId: string, updates: Partial<TempChannelData>): void;
    getActiveTempChannels(): TempChannelData[];
}
interface TempChannelData {
    channelId: string;
    ownerId: string;
    createdAt: Date;
    lastActivity: Date;
    isLocked: boolean;
    isHidden: boolean;
    userLimit: number;
}
export {};
//# sourceMappingURL=index.d.ts.map