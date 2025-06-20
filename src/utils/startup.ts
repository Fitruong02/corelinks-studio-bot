// ===== src/utils/startup.ts =====
import { Logger } from '@utils/logger';
import { config } from '@config/config';
import { FeatureManager } from '@config/features';

export class StartupManager {
  private static logger = new Logger('StartupManager');

  static async performStartupChecks(): Promise<boolean> {
    try {
      this.logger.info('🚀 Starting Corelinks Studio Discord Bot...');
      
      // Display startup banner
      this.displayBanner();

      // Check environment
      await this.checkEnvironment();

      // Display configuration
      this.displayConfiguration();

      this.logger.info('✅ All startup checks passed');
      return true;

    } catch (error) {
      this.logger.error('❌ Startup checks failed:', error);
      return false;
    }
  }

  private static displayBanner(): void {
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

  private static async checkEnvironment(): Promise<void> {
    this.logger.info('🔍 Checking environment configuration...');

    // Check Node.js version
    const nodeVersion = process.version;
    const requiredVersion = '18.0.0';
    
    if (!this.isVersionCompatible(nodeVersion.slice(1), requiredVersion)) {
      throw new Error(`Node.js ${requiredVersion}+ required, current: ${nodeVersion}`);
    }
    this.logger.info(`✓ Node.js version: ${nodeVersion}`);

    // Check required environment variables
    const required = ['DISCORD_TOKEN', 'GUILD_ID', 'CLIENT_ID'];
    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }
    this.logger.info('✓ Required environment variables present');

    // Check feature-specific requirements
    // if (FeatureManager.isEnabled('paymentSystem')) {
    //   const payosVars = ['PAYOS_CLIENT_ID', 'PAYOS_API_KEY', 'PAYOS_CHECKSUM_KEY'];
    //   for (const key of payosVars) {
    //     if (!process.env[key]) {
    //       throw new Error(`PayOS enabled but missing: ${key}`);
    //     }
    //   }
    //   this.logger.info('✓ PayOS configuration validated');
    // }

    // if (FeatureManager.isEnabled('analytics')) {
    //   const googleVars = ['GOOGLE_SHEETS_ID', 'GOOGLE_CREDENTIALS'];
    //   for (const key of googleVars) {
    //     if (!process.env[key]) {
    //       throw new Error(`Analytics enabled but missing: ${key}`);
    //     }
    //   }
    //   this.logger.info('✓ Google Sheets configuration validated');
    // }
  }

  private static displayConfiguration(): void {
    this.logger.info('📋 Bot Configuration:');
    this.logger.info(`   Environment: ${config.settings.nodeEnv}`);
    this.logger.info(`   Log Level: ${config.settings.logLevel}`);
    this.logger.info(`   Guild ID: ${config.discord.guildId}`);
    
    const enabledFeatures = FeatureManager.getEnabledFeatures();
    this.logger.info(`   Enabled Features (${enabledFeatures.length}): ${enabledFeatures.join(', ')}`);
    
    const disabledFeatures = FeatureManager.getDisabledFeatures();
    if (disabledFeatures.length > 0) {
      this.logger.info(`   Disabled Features: ${disabledFeatures.join(', ')}`);
    }
  }

  private static isVersionCompatible(current: string, required: string): boolean {
    const currentParts = current.split('.').map(Number);
    const requiredParts = required.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, requiredParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const requiredPart = requiredParts[i] || 0;

      if (currentPart > requiredPart) return true;
      if (currentPart < requiredPart) return false;
    }

    return true;
  }

  static handleProcessEvents(): void {
    // Graceful shutdown handlers
    process.on('SIGINT', async () => {
      this.logger.info('📴 Received SIGINT, shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      this.logger.info('📴 Received SIGTERM, shutting down gracefully...');
      process.exit(0);
    });

    // Error handlers
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      this.logger.error('🚨 Uncaught Exception:', error);
      process.exit(1);
    });
  }
}
