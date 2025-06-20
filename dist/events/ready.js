"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readyEvent = readyEvent;
const discord_js_1 = require("discord.js");
const logger_1 = require("@utils/logger");
const logger = new logger_1.Logger('ReadyEvent');
function readyEvent(bot) {
    bot.client.on(discord_js_1.Events.ClientReady, async () => {
        try {
            logger.info(`Bot is ready! Logged in as ${bot.client.user?.tag}`);
            await bot.initializeChannelManager();
            bot.client.user?.setActivity('Corelinks Studio', { type: 0 });
            logger.info('Corelinks Studio Discord Bot is now operational');
        }
        catch (error) {
            logger.error('Error in ready event:', error);
        }
    });
}
//# sourceMappingURL=ready.js.map