import { CorelinksBot } from '../../bot';
import { VoiceManager } from './index';
export declare class VoiceControlManager {
    private bot;
    private logger;
    private voiceManager;
    constructor(bot: CorelinksBot, voiceManager: VoiceManager);
    handleChannelControl(interaction: any, action: string, channelId: string): Promise<void>;
    private handleRename;
    private handleLock;
    private handleUnlock;
    private handleHide;
    private handleShow;
    private handleLimit;
    private handleInvite;
    private handleDelete;
    handleDeleteConfirmation(interaction: any, channelId: string, confirmed: boolean): Promise<void>;
    private logChannelAction;
}
//# sourceMappingURL=controls.d.ts.map