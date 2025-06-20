import { User, GuildMember, TextChannel } from 'discord.js';
export declare class HelperUtils {
    private static logger;
    static sleep(milliseconds: number): Promise<void>;
    static formatUserTag(user: User | GuildMember): string;
    static formatTimestamp(date: Date): string;
    static formatRelativeTime(date: Date): string;
    static safeChannelSend(channel: TextChannel, content: any): Promise<boolean>;
    static safeDMSend(user: User, content: any): Promise<boolean>;
    static getWeekStart(date?: Date): Date;
    static escapeMarkdown(text: string): string;
    static chunkArray<T>(array: T[], chunkSize: number): T[][];
    static randomChoice<T>(array: T[]): T;
    static calculatePercentage(value: number, total: number): number;
}
//# sourceMappingURL=helpers.d.ts.map