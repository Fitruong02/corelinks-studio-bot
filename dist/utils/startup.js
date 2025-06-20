"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartupManager = void 0;
const logger_1 = require("@utils/logger");
const config_1 = require("@config/config");
const features_1 = require("@config/features");
class StartupManager {
    static logger = new logger_1.Logger('StartupManager');
    static async performStartupChecks() {
        try {
            this.logger.info('🚀 Starting Corelinks Studio Discord Bot...');
            this.displayBanner();
            await this.checkEnvironment();
            this.displayConfiguration();
            this.logger.info('✅ All startup checks passed');
            return true;
        }
        catch (error) {
            this.logger.error('❌ Startup checks failed:', error);
            return false;
        }
    }
    static displayBanner() {
        console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   ██████╗ ██████╗ ██████╗ ███████╗██╗     ██╗███╗   ██╗██╗  ██╗ ███████║      ║
║  ██╔════╝██╔═══██╗██╔══██╗██╔════╝██║     ██║████╗  ██║██║ ██╔╝ ██║           ║
║  ██║     ██║   ██║██████╔╝█████╗  ██║     ██║██╔██╗ ██║█████╔╝    ██║         ║
║  ██║     ██║   ██║██╔══██╗██╔══╝  ██║     ██║██║╚██╗██║██╔═██╗       ██║      ║
║  ╚██████╗╚██████╔╝██║  ██║███████╗███████╗██║██║ ╚████║██║  ██╗ ████║██║      ║
║   ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝ ╚══════╝      ║
║                                                                               ║
║                              STUDIO DISCORD BOT                               ║
║                          Professional Support System                          ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    `);
    }
    static async checkEnvironment() {
        this.logger.info('🔍 Checking environment configuration...');
        const nodeVersion = process.version;
        const requiredVersion = '18.0.0';
        if (!this.isVersionCompatible(nodeVersion.slice(1), requiredVersion)) {
            throw new Error(`Node.js ${requiredVersion}+ required, current: ${nodeVersion}`);
        }
        this.logger.info(`✓ Node.js version: ${nodeVersion}`);
        const required = ['DISCORD_TOKEN', 'GUILD_ID', 'CLIENT_ID'];
        for (const key of required) {
            if (!process.env[key]) {
                throw new Error(`Missing required environment variable: ${key}`);
            }
        }
        this.logger.info('✓ Required environment variables present');
        if (features_1.FeatureManager.isEnabled('paymentSystem')) {
            const payosVars = ['PAYOS_CLIENT_ID', 'PAYOS_API_KEY', 'PAYOS_CHECKSUM_KEY'];
            for (const key of payosVars) {
                if (!process.env[key]) {
                    throw new Error(`PayOS enabled but missing: ${key}`);
                }
            }
            this.logger.info('✓ PayOS configuration validated');
        }
        if (features_1.FeatureManager.isEnabled('analytics')) {
            const googleVars = ['GOOGLE_SHEETS_ID', 'GOOGLE_CREDENTIALS'];
            for (const key of googleVars) {
                if (!process.env[key]) {
                    throw new Error(`Analytics enabled but missing: ${key}`);
                }
            }
            this.logger.info('✓ Google Sheets configuration validated');
        }
    }
    static displayConfiguration() {
        this.logger.info('📋 Bot Configuration:');
        this.logger.info(`   Environment: ${config_1.config.settings.nodeEnv}`);
        this.logger.info(`   Log Level: ${config_1.config.settings.logLevel}`);
        this.logger.info(`   Guild ID: ${config_1.config.discord.guildId}`);
        const enabledFeatures = features_1.FeatureManager.getEnabledFeatures();
        this.logger.info(`   Enabled Features (${enabledFeatures.length}): ${enabledFeatures.join(', ')}`);
        const disabledFeatures = features_1.FeatureManager.getDisabledFeatures();
        if (disabledFeatures.length > 0) {
            this.logger.info(`   Disabled Features: ${disabledFeatures.join(', ')}`);
        }
    }
    static isVersionCompatible(current, required) {
        const currentParts = current.split('.').map(Number);
        const requiredParts = required.split('.').map(Number);
        for (let i = 0; i < Math.max(currentParts.length, requiredParts.length); i++) {
            const currentPart = currentParts[i] || 0;
            const requiredPart = requiredParts[i] || 0;
            if (currentPart > requiredPart)
                return true;
            if (currentPart < requiredPart)
                return false;
        }
        return true;
    }
    static handleProcessEvents() {
        process.on('SIGINT', async () => {
            this.logger.info('📴 Received SIGINT, shutting down gracefully...');
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            this.logger.info('📴 Received SIGTERM, shutting down gracefully...');
            process.exit(0);
        });
        process.on('unhandledRejection', (reason, promise) => {
            this.logger.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
        });
        process.on('uncaughtException', (error) => {
            this.logger.error('🚨 Uncaught Exception:', error);
            process.exit(1);
        });
    }
}
exports.StartupManager = StartupManager;
//# sourceMappingURL=startup.js.map