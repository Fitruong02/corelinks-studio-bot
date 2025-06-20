"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageCreateEvent = messageCreateEvent;
const discord_js_1 = require("discord.js");
const logger_1 = require("@utils/logger");
const automod_1 = require("@modules/moderation/automod");
const logger = new logger_1.Logger('MessageCreateEvent');
function messageCreateEvent(bot) {
    bot.client.on(discord_js_1.Events.MessageCreate, async (message) => {
        try {
            if (message.author.bot)
                return;
            if (!message.guild)
                return;
            const automod = new automod_1.AutoModerationManager(bot);
            await automod.processMessage(message);
        }
        catch (error) {
            logger.error('Error in messageCreate event:', error);
        }
    });
}
//# sourceMappingURL=messageCreate.js.map