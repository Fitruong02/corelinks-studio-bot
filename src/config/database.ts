// ===== src/config/database.ts =====
import mysql from 'mysql2/promise';
import { config } from '@config/config';
import { Logger } from '@utils/logger';
import { DatabaseConnection } from '../types/database';

class DatabaseManager implements DatabaseConnection {
  private pool: mysql.Pool;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('Database');
    this.pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    try {
      const [results] = await this.pool.execute(sql, params);
      return results;
    } catch (error) {
      this.logger.error('Database query error:', error);
      throw error;
    }
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    try {
      const [results] = await this.pool.execute(sql, params);
      return results;
    } catch (error) {
      this.logger.error('Database execute error:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.pool.execute('SELECT 1');
      this.logger.info('Database connection successful');
      return true;
    } catch (error) {
      this.logger.error('Database connection failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    try {
      await this.pool.end();
      this.logger.info('Database connection closed');
    } catch (error) {
      this.logger.error('Error closing database connection:', error);
      throw error;
    }
  }

  async initializeTables(): Promise<void> {
    const tables = [
      `CREATE TABLE IF NOT EXISTS backups (
        id INT PRIMARY KEY AUTO_INCREMENT,
        type VARCHAR(50) NOT NULL,
        data JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_type (type),
        INDEX idx_created_at (created_at)
      )`,
      `CREATE TABLE IF NOT EXISTS analytics_weekly (
        id INT PRIMARY KEY AUTO_INCREMENT,
        week_start DATE NOT NULL,
        ticket_count INT DEFAULT 0,
        revenue DECIMAL(10,2) DEFAULT 0,
        satisfaction_avg DECIMAL(3,2) DEFAULT 0,
        member_growth INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_week (week_start)
      )`,
      `CREATE TABLE IF NOT EXISTS bot_config (
        id INT PRIMARY KEY AUTO_INCREMENT,
        key_name VARCHAR(100) UNIQUE NOT NULL,
        value JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_key_name (key_name)
      )`
    ];

    try {
      for (const table of tables) {
        await this.execute(table);
      }
      this.logger.info('Database tables initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize database tables:', error);
      throw error;
    }
  }
}

export const database = new DatabaseManager();