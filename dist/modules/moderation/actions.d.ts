import { CorelinksBot } from '../../bot';
import { GuildMember, User } from 'discord.js';
export declare class ModerationActionManager {
    private bot;
    private logger;
    private actionHistory;
    constructor(bot: CorelinksBot);
    executeAction(action: ModerationActionType, target: GuildMember | User, moderator: GuildMember, options: ModerationActionOptions): Promise<boolean>;
    private warnUser;
    private timeoutUser;
    private muteUser;
    private kickUser;
    private banUser;
    private unbanUser;
    getUserHistory(userId: string, limit?: number): Promise<ModerationAction[]>;
    getModeratorStats(moderatorId: string, days?: number): Promise<ModeratorStats>;
    private recordAction;
    getActionHistory(): Map<string, ModerationAction[]>;
}
type ModerationActionType = 'warn' | 'timeout' | 'mute' | 'kick' | 'ban' | 'unban';
interface ModerationActionOptions {
    reason?: string;
    duration?: number;
}
interface ModerationAction {
    type: ModerationActionType;
    moderatorId: string;
    reason: string;
    duration?: number;
    timestamp: Date;
}
interface ModeratorStats {
    totalActions: number;
    actionCounts: Record<ModerationActionType, number>;
    period: number;
}
export {};
//# sourceMappingURL=actions.d.ts.map