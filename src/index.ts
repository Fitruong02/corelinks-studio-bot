import { validateConfig } from '@config/config';
import { database } from '@config/database';
import { CorelinksBot } from './bot';
import { StartupManager } from '@utils/startup';
import { Logger } from '@utils/logger';

const logger = new Logger('Main');

async function startBot(): Promise<void> {
  try {
    // Setup process event handlers
    StartupManager.handleProcessEvents();

    // Perform startup checks
    const startupSuccess = await StartupManager.performStartupChecks();
    if (!startupSuccess) {
      process.exit(1);
    }

    // Validate configuration
    validateConfig();
    logger.info('✅ Configuration validated successfully');

    // Test database connection
    const dbConnected = await database.testConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }
    logger.info('✅ Database connection established');

    // Initialize database tables
    await database.initializeTables();
    logger.info('✅ Database tables initialized');

    // Initialize and start bot
    const bot = new CorelinksBot();
    await bot.initialize();
    logger.info('✅ Bot components initialized');

    await bot.start();
    logger.info('✅ Bot authentication successful');

    // Success message will be logged by ready event

  } catch (error) {
    logger.error('❌ Failed to start bot:', error);
    // More detailed error messages for common issues
    if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') {
      const errMsg = (error as any).message as string;
      if (errMsg.includes('TOKEN_INVALID')) {
        logger.error('🔑 Discord token is invalid. Please check DISCORD_TOKEN in your .env file');
      } else if (errMsg.includes('ECONNREFUSED')) {
        logger.error('🗄️  Database connection refused. Please ensure MySQL is running and credentials are correct');
      } else if (errMsg.includes('Missing required environment')) {
        logger.error('⚙️  Environment configuration incomplete. Please check your .env file');
      }
    }
    // Cleanup and exit
    try {
      await database.close();
    } catch (closeError) {
      logger.error('Error closing database connection:', closeError);
    }
    
    process.exit(1);
  }
}

// Global error handlers for development
if (process.env.NODE_ENV === 'development') {
  process.on('warning', (warning) => {
    logger.warn('Node.js Warning:', warning.message);
  });
}

// Start the bot
logger.info('🔄 Initializing Corelinks Studio Discord Bot...');
startBot().catch((error) => {
  logger.error('💥 Critical startup error:', error);
  process.exit(1);
});