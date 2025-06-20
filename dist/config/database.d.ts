import { DatabaseConnection } from '../types/database';
declare class DatabaseManager implements DatabaseConnection {
    private pool;
    private logger;
    constructor();
    query(sql: string, params?: any[]): Promise<any>;
    execute(sql: string, params?: any[]): Promise<any>;
    testConnection(): Promise<boolean>;
    close(): Promise<void>;
    initializeTables(): Promise<void>;
}
export declare const database: DatabaseManager;
export {};
//# sourceMappingURL=database.d.ts.map