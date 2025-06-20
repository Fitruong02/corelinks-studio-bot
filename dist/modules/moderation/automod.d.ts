import { CorelinksBot } from '../../bot';
import { Message } from 'discord.js';
export declare class AutoModerationManager {
    private bot;
    private logger;
    private userViolations;
    private settings;
    constructor(bot: CorelinksBot);
    processMessage(message: Message): Promise<void>;
    private checkInviteLinks;
    private checkSpam;
    private checkEveryoneMentions;
    private checkBlockedLinks;
    private handleViolation;
    private executeAutoModAction;
    private logAutoModAction;
    private getUserViolations;
    private calculateSimilarity;
    private getEditDistance;
    private resetViolationCounters;
    private loadSettings;
    private getDefaultSettings;
    updateSettings(newSettings: Partial<AutoModSettings>): Promise<void>;
    getSettings(): AutoModSettings;
}
interface AutoModSettings {
    inviteLinks: AutoModRule;
    spam: AutoModRule;
    everyoneMentions: AutoModRule;
    blockedLinks: string[];
}
interface AutoModRule {
    enabled: boolean;
    threshold: number;
    action: 'mute' | 'kick' | 'ban' | 'timeout';
    duration?: number;
}
export {};
//# sourceMappingURL=automod.d.ts.map