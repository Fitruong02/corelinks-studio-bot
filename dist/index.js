"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@config/config");
const database_1 = require("@config/database");
const bot_1 = require("./bot");
const startup_1 = require("@utils/startup");
const logger_1 = require("@utils/logger");
const logger = new logger_1.Logger('Main');
async function startBot() {
    try {
        startup_1.StartupManager.handleProcessEvents();
        const startupSuccess = await startup_1.StartupManager.performStartupChecks();
        if (!startupSuccess) {
            process.exit(1);
        }
        (0, config_1.validateConfig)();
        logger.info('✅ Configuration validated successfully');
        const dbConnected = await database_1.database.testConnection();
        if (!dbConnected) {
            throw new Error('Failed to connect to database');
        }
        logger.info('✅ Database connection established');
        await database_1.database.initializeTables();
        logger.info('✅ Database tables initialized');
        const bot = new bot_1.CorelinksBot();
        await bot.initialize();
        logger.info('✅ Bot components initialized');
        await bot.start();
        logger.info('✅ Bot authentication successful');
    }
    catch (error) {
        logger.error('❌ Failed to start bot:', error);
        if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
            const errMsg = error.message;
            if (errMsg.includes('TOKEN_INVALID')) {
                logger.error('🔑 Discord token is invalid. Please check DISCORD_TOKEN in your .env file');
            }
            else if (errMsg.includes('ECONNREFUSED')) {
                logger.error('🗄️  Database connection refused. Please ensure MySQL is running and credentials are correct');
            }
            else if (errMsg.includes('Missing required environment')) {
                logger.error('⚙️  Environment configuration incomplete. Please check your .env file');
            }
        }
        try {
            await database_1.database.close();
        }
        catch (closeError) {
            logger.error('Error closing database connection:', closeError);
        }
        process.exit(1);
    }
}
if (process.env.NODE_ENV === 'development') {
    process.on('warning', (warning) => {
        logger.warn('Node.js Warning:', warning.message);
    });
}
logger.info('🔄 Initializing Corelinks Studio Discord Bot...');
startBot().catch((error) => {
    logger.error('💥 Critical startup error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map