"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const config_1 = require("@config/config");
const logger_1 = require("@utils/logger");
class DatabaseManager {
    pool;
    logger;
    constructor() {
        this.logger = new logger_1.Logger('Database');
        this.pool = promise_1.default.createPool({
            host: config_1.config.database.host,
            port: config_1.config.database.port,
            user: config_1.config.database.user,
            password: config_1.config.database.password,
            database: config_1.config.database.name,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }
    async query(sql, params = []) {
        try {
            const [results] = await this.pool.execute(sql, params);
            return results;
        }
        catch (error) {
            this.logger.error('Database query error:', error);
            throw error;
        }
    }
    async execute(sql, params = []) {
        try {
            const [results] = await this.pool.execute(sql, params);
            return results;
        }
        catch (error) {
            this.logger.error('Database execute error:', error);
            throw error;
        }
    }
    async testConnection() {
        try {
            await this.pool.execute('SELECT 1');
            this.logger.info('Database connection successful');
            return true;
        }
        catch (error) {
            this.logger.error('Database connection failed:', error);
            return false;
        }
    }
    async close() {
        try {
            await this.pool.end();
            this.logger.info('Database connection closed');
        }
        catch (error) {
            this.logger.error('Error closing database connection:', error);
            throw error;
        }
    }
    async initializeTables() {
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
        }
        catch (error) {
            this.logger.error('Failed to initialize database tables:', error);
            throw error;
        }
    }
}
exports.database = new DatabaseManager();
//# sourceMappingURL=database.js.map