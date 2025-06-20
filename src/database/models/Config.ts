// ===== src/database/models/Config.ts =====
import { database } from '@config/database';
import { BotConfigRecord } from '../../types/database.js';
import { Logger } from '@utils/logger';

export class ConfigModel {
  private static logger = new Logger('ConfigModel');

  static async set(key: string, value: any): Promise<boolean> {
    try {
      await database.execute(
        `INSERT INTO bot_config (key_name, value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = CURRENT_TIMESTAMP`,
        [key, JSON.stringify(value)]
      );
      
      this.logger.info(`Updated config key: ${key}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to set config value:', error);
      return false;
    }
  }

  static async get(key: string): Promise<any | null> {
    try {
      const results = await database.query(
        'SELECT value FROM bot_config WHERE key_name = ?',
        [key]
      );
      
      if (results.length === 0) return null;
      
      return JSON.parse(results[0].value);
    } catch (error) {
      this.logger.error('Failed to get config value:', error);
      return null;
    }
  }

  static async getAll(): Promise<Record<string, any>> {
    try {
      const results = await database.query('SELECT key_name, value FROM bot_config');
      
      const config: Record<string, any> = {};
      for (const row of results) {
        config[row.key_name] = JSON.parse(row.value);
      }
      
      return config;
    } catch (error) {
      this.logger.error('Failed to get all config values:', error);
      return {};
    }
  }

  static async delete(key: string): Promise<boolean> {
    try {
      const result = await database.execute(
        'DELETE FROM bot_config WHERE key_name = ?',
        [key]
      );
      
      this.logger.info(`Deleted config key: ${key} (affected: ${result.affectedRows})`);
      return result.affectedRows > 0;
    } catch (error) {
      this.logger.error('Failed to delete config value:', error);
      return false;
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const results = await database.query(
        'SELECT 1 FROM bot_config WHERE key_name = ?',
        [key]
      );
      
      return results.length > 0;
    } catch (error) {
      this.logger.error('Failed to check config existence:', error);
      return false;
    }
  }
}