"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigModel = void 0;
const database_1 = require("@config/database");
const logger_1 = require("@utils/logger");
class ConfigModel {
    static logger = new logger_1.Logger('ConfigModel');
    static async set(key, value) {
        try {
            await database_1.database.execute(`INSERT INTO bot_config (key_name, value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = CURRENT_TIMESTAMP`, [key, JSON.stringify(value)]);
            this.logger.info(`Updated config key: ${key}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to set config value:', error);
            return false;
        }
    }
    static async get(key) {
        try {
            const results = await database_1.database.query('SELECT value FROM bot_config WHERE key_name = ?', [key]);
            if (results.length === 0)
                return null;
            return JSON.parse(results[0].value);
        }
        catch (error) {
            this.logger.error('Failed to get config value:', error);
            return null;
        }
    }
    static async getAll() {
        try {
            const results = await database_1.database.query('SELECT key_name, value FROM bot_config');
            const config = {};
            for (const row of results) {
                config[row.key_name] = JSON.parse(row.value);
            }
            return config;
        }
        catch (error) {
            this.logger.error('Failed to get all config values:', error);
            return {};
        }
    }
    static async delete(key) {
        try {
            const result = await database_1.database.execute('DELETE FROM bot_config WHERE key_name = ?', [key]);
            this.logger.info(`Deleted config key: ${key} (affected: ${result.affectedRows})`);
            return result.affectedRows > 0;
        }
        catch (error) {
            this.logger.error('Failed to delete config value:', error);
            return false;
        }
    }
    static async exists(key) {
        try {
            const results = await database_1.database.query('SELECT 1 FROM bot_config WHERE key_name = ?', [key]);
            return results.length > 0;
        }
        catch (error) {
            this.logger.error('Failed to check config existence:', error);
            return false;
        }
    }
}
exports.ConfigModel = ConfigModel;
//# sourceMappingURL=Config.js.map