import { CorelinksBot } from '../../bot';
import { GuildMember, User, TextChannel, Message } from 'discord.js';
import { AutoModerationManager } from './automod';
import { ModerationActionManager } from './actions';
import { MassModerationManager } from './massActions';
export declare class ModerationManager {
    private bot;
    private logger;
    private autoMod;
    private actionManager;
    private massActionManager;
    private warnings;
    constructor(bot: CorelinksBot);
    warnUser(target: GuildMember, moderator: GuildMember, reason: string): Promise<boolean>;
    timeoutUser(target: GuildMember, moderator: GuildMember, duration: number, reason: string): Promise<boolean>;
    muteUser(target: GuildMember, moderator: GuildMember, duration: number, reason: string): Promise<boolean>;
    kickUser(target: GuildMember, moderator: GuildMember, reason: string): Promise<boolean>;
    banUser(target: GuildMember | User, moderator: GuildMember, duration: number | null, reason: string): Promise<boolean>;
    roleLockUser(target: GuildMember, moderator: GuildMember, duration: number, reason: string): Promise<boolean>;
    clearMessages(channel: TextChannel, amount: number, moderator: GuildMember, filter?: (msg: Message) => boolean): Promise<number>;
    getUserWarnings(userId: string): Promise<UserWarning[]>;
    removeWarning(userId: string, warningId: string, moderator: GuildMember): Promise<boolean>;
    private logModerationAction;
    private formatDuration;
    getAutoMod(): AutoModerationManager;
    getActionManager(): ModerationActionManager;
    getMassActionManager(): MassModerationManager;
}
interface UserWarning {
    id: string;
    userId: string;
    moderatorId: string;
    reason: string;
    timestamp: Date;
}
export {};
//# sourceMappingURL=index.d.ts.map