// ===== src/database/models/Backup.ts =====
import { database } from '@config/database';
import { BackupRecord, BackupType } from '../../types/database';
import { Logger } from '@utils/logger';

export class BackupModel {
  private static logger = new Logger('BackupModel');

  static async create(type: BackupType, data: any): Promise<number | null> {
    try {
      const result = await database.execute(
        'INSERT INTO backups (type, data) VALUES (?, ?)',
        [type, JSON.stringify(data)]
      );
      
      this.logger.info(`Created backup record: ${type}`);
      return result.insertId;
    } catch (error) {
      this.logger.error('Failed to create backup record:', error);
      return null;
    }
  }

  static async getByType(type: BackupType, limit: number = 10): Promise<BackupRecord[]> {
    try {
      const results = await database.query(
        'SELECT * FROM backups WHERE type = ? ORDER BY created_at DESC LIMIT ?',
        [type, limit]
      );
      
      return results.map((row: any) => ({
        id: row.id,
        type: row.type,
        data: JSON.parse(row.data),
        createdAt: row.created_at
      }));
    } catch (error) {
      this.logger.error('Failed to get backup records by type:', error);
      return [];
    }
  }

  static async getById(id: number): Promise<BackupRecord | null> {
    try {
      const results = await database.query(
        'SELECT * FROM backups WHERE id = ?',
        [id]
      );
      
      if (results.length === 0) return null;
      
      const row = results[0];
      return {
        id: row.id,
        type: row.type,
        data: JSON.parse(row.data),
        createdAt: row.created_at
      };
    } catch (error) {
      this.logger.error('Failed to get backup record by ID:', error);
      return null;
    }
  }

  static async deleteOldRecords(type: BackupType, daysOld: number = 30): Promise<number> {
    try {
      const result = await database.execute(
        'DELETE FROM backups WHERE type = ? AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
        [type, daysOld]
      );
      
      this.logger.info(`Deleted ${result.affectedRows} old backup records for ${type}`);
      return result.affectedRows;
    } catch (error) {
      this.logger.error('Failed to delete old backup records:', error);
      return 0;
    }
  }
}