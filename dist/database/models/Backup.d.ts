import { BackupRecord, BackupType } from '../../types/database';
export declare class BackupModel {
    private static logger;
    static create(type: BackupType, data: any): Promise<number | null>;
    static getByType(type: BackupType, limit?: number): Promise<BackupRecord[]>;
    static getById(id: number): Promise<BackupRecord | null>;
    static deleteOldRecords(type: BackupType, daysOld?: number): Promise<number>;
}
//# sourceMappingURL=Backup.d.ts.map