"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupModel = void 0;
const database_1 = require("@config/database");
const logger_1 = require("@utils/logger");
class BackupModel {
    static logger = new logger_1.Logger('BackupModel');
    static async create(type, data) {
        try {
            const result = await database_1.database.execute('INSERT INTO backups (type, data) VALUES (?, ?)', [type, JSON.stringify(data)]);
            this.logger.info(`Created backup record: ${type}`);
            return result.insertId;
        }
        catch (error) {
            this.logger.error('Failed to create backup record:', error);
            return null;
        }
    }
    static async getByType(type, limit = 10) {
        try {
            const results = await database_1.database.query('SELECT * FROM backups WHERE type = ? ORDER BY created_at DESC LIMIT ?', [type, limit]);
            return results.map((row) => ({
                id: row.id,
                type: row.type,
                data: JSON.parse(row.data),
                createdAt: row.created_at
            }));
        }
        catch (error) {
            this.logger.error('Failed to get backup records by type:', error);
            return [];
        }
    }
    static async getById(id) {
        try {
            const results = await database_1.database.query('SELECT * FROM backups WHERE id = ?', [id]);
            if (results.length === 0)
                return null;
            const row = results[0];
            return {
                id: row.id,
                type: row.type,
                data: JSON.parse(row.data),
                createdAt: row.created_at
            };
        }
        catch (error) {
            this.logger.error('Failed to get backup record by ID:', error);
            return null;
        }
    }
    static async deleteOldRecords(type, daysOld = 30) {
        try {
            const result = await database_1.database.execute('DELETE FROM backups WHERE type = ? AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)', [type, daysOld]);
            this.logger.info(`Deleted ${result.affectedRows} old backup records for ${type}`);
            return result.affectedRows;
        }
        catch (error) {
            this.logger.error('Failed to delete old backup records:', error);
            return 0;
        }
    }
}
exports.BackupModel = BackupModel;
//# sourceMappingURL=Backup.js.map