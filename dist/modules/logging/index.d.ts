import { CorelinksBot } from '../../bot';
import { Message, User, VoiceState, GuildMember, Invite } from 'discord.js';
import { ChannelLogger } from './channels';
import { DiscordLogger } from './discord';
export declare class LoggingManager {
    private bot;
    private logger;
    private channelLogger;
    private discordLogger;
    private inviteCache;
    constructor(bot: CorelinksBot);
    logJoinLeave(member: GuildMember, type: 'join' | 'leave', inviteUsed?: Invite): Promise<void>;
    logInviteUse(invite: Invite): Promise<void>;
    logMessageEdit(oldMessage: Message, newMessage: Message): Promise<void>;
    logMessageDelete(message: Message): Promise<void>;
    logVoiceActivity(oldState: VoiceState, newState: VoiceState): Promise<void>;
    logCommandUsage(commandName: string, user: User, channelId: string, guildId: string): Promise<void>;
    logPaymentActivity(type: string, details: any): Promise<void>;
    private cacheInvites;
    detectInviteUsed(guildId: string): Promise<Invite | null>;
    getChannelLogger(): ChannelLogger;
    getDiscordLogger(): DiscordLogger;
}
//# sourceMappingURL=index.d.ts.map