export interface BackupRecord {
    id: number;
    type: BackupType;
    data: any;
    createdAt: Date;
}
export declare enum BackupType {
    TICKET_DATA = "ticket_data",
    PAYMENT_DATA = "payment_data",
    USER_RATINGS = "user_ratings",
    WEEKLY_ANALYTICS = "weekly_analytics",
    BOT_CONFIG = "bot_config"
}
export interface AnalyticsWeekly {
    id: number;
    weekStart: Date;
    ticketCount: number;
    revenue: number;
    satisfactionAvg: number;
    memberGrowth: number;
    createdAt: Date;
}
export interface BotConfigRecord {
    id: number;
    keyName: string;
    value: any;
    updatedAt: Date;
}
export interface DatabaseConnection {
    query(sql: string, params?: any[]): Promise<any>;
    execute(sql: string, params?: any[]): Promise<any>;
    close(): Promise<void>;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginationResult<T> {
    items: T[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}
//# sourceMappingURL=database.d.ts.map