"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.validateConfig = validateConfig;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    discord: {
        token: process.env.DISCORD_TOKEN,
        clientId: process.env.CLIENT_ID,
        guildId: process.env.GUILD_ID
    },
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASS
    },
    payos: {
        clientId: process.env.PAYOS_CLIENT_ID,
        apiKey: process.env.PAYOS_API_KEY,
        checksumKey: process.env.PAYOS_CHECKSUM_KEY
    },
    google: {
        sheetsId: process.env.GOOGLE_SHEETS_ID,
        credentials: process.env.GOOGLE_CREDENTIALS
    },
    roles: {
        founder: process.env.FOUNDER_ROLE_ID,
        staff: process.env.STAFF_ROLE_ID,
        customer: process.env.CUSTOMER_ROLE_ID,
        discordServiceStaff: process.env.DISCORD_SERVICE_STAFF_ROLE_ID,
        minecraftServiceStaff: process.env.MINECRAFT_SERVICE_STAFF_ROLE_ID,
        gameServiceStaff: process.env.GAME_SERVICE_STAFF_ROLE_ID
    },
    channels: {
        ticketRequests: process.env.TICKET_REQUESTS_CHANNEL_ID,
        ticketLogs: process.env.TICKET_LOGS_CHANNEL_ID,
        paymentLogs: process.env.PAYMENT_LOGS_CHANNEL_ID,
        voiceLogs: process.env.VOICE_LOGS_CHANNEL_ID,
        modLogs: process.env.MOD_LOGS_CHANNEL_ID,
        automodLogs: process.env.AUTOMOD_LOGS_CHANNEL_ID,
        joinLeave: process.env.JOIN_LEAVE_CHANNEL_ID,
        inviteLogs: process.env.INVITE_LOGS_CHANNEL_ID,
        cmdLogs: process.env.CMD_LOGS_CHANNEL_ID,
        alerts: process.env.ALERTS_CHANNEL_ID,
        voiceCreate: process.env.VOICE_CREATE_CHANNEL_ID,
        voiceTempCategoryId: process.env.VOICE_TEMP_CATEGORY_ID,
        voiceTempCategory: process.env.VOICE_TEMP_CATEGORY
    },
    settings: {
        nodeEnv: process.env.NODE_ENV || 'development',
        logLevel: process.env.LOG_LEVEL || 'info',
        ticketAutoCloseDays: parseInt(process.env.TICKET_AUTO_CLOSE_DAYS || '7'),
        voiceInactiveMinutes: parseInt(process.env.VOICE_INACTIVE_MINUTES || '5'),
        paymentTimeoutHours: parseInt(process.env.PAYMENT_TIMEOUT_HOURS || '1')
    }
};
function validateConfig() {
    const requiredFields = [
        'DISCORD_TOKEN',
        'CLIENT_ID',
        'GUILD_ID',
        'DB_NAME',
        'DB_USER',
        'DB_PASS',
        'PAYOS_CLIENT_ID',
        'PAYOS_API_KEY',
        'PAYOS_CHECKSUM_KEY',
        'GOOGLE_SHEETS_ID',
        'GOOGLE_CREDENTIALS'
    ];
    const missingFields = requiredFields.filter(field => !process.env[field]);
    if (missingFields.length > 0) {
        throw new Error(`Missing required environment variables: ${missingFields.join(', ')}`);
    }
}
//# sourceMappingURL=config.js.map