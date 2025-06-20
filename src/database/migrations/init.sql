// ===== src/database/migrations/init.sql =====
-- Corelinks Studio Discord Bot - Database Initialization
-- This script creates the necessary tables for the bot

-- Create backups table for storing bot data backups
CREATE TABLE IF NOT EXISTS backups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type VARCHAR(50) NOT NULL,
    data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create analytics_weekly table for weekly statistics
CREATE TABLE IF NOT EXISTS analytics_weekly (
    id INT PRIMARY KEY AUTO_INCREMENT,
    week_start DATE NOT NULL,
    ticket_count INT DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    satisfaction_avg DECIMAL(3,2) DEFAULT 0,
    member_growth INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_week (week_start),
    INDEX idx_week_start (week_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create bot_config table for dynamic configuration
CREATE TABLE IF NOT EXISTS bot_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    value JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key_name (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default configuration values
INSERT IGNORE INTO bot_config (key_name, value) VALUES
('automod_settings', '{"invite_links": {"enabled": true, "threshold": 3, "action": "mute", "duration": 7200}, "spam": {"enabled": true, "threshold": 10, "action": "kick"}, "everyone_mentions": {"enabled": true, "threshold": 2, "action": "mute", "duration": 7200}}'),
('ticket_settings', '{"auto_close_days": 7, "max_open_per_user": 1, "services": ["Game", "Discord", "Minecraft"]}'),
('voice_settings', '{"inactive_timeout_minutes": 5, "default_user_limit": 10}'),
('payment_settings', '{"timeout_hours": 1, "supported_methods": ["BANKING", "MOMO"]}');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_backups_type_created ON backups(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_week_start ON analytics_weekly(week_start DESC);