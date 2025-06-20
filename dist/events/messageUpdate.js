"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageUpdateEvent = messageUpdateEvent;
exports.messageDeleteEvent = messageDeleteEvent;
const discord_js_1 = require("discord.js");
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
const helpers_1 = require("@utils/helpers");
const validation_1 = require("@utils/validation");
const logger = new logger_1.Logger('MessageUpdateEvent');
function messageUpdateEvent(bot) {
    bot.client.on(discord_js_1.Events.MessageUpdate, async (oldMessage, newMessage) => {
        try {
            if (!newMessage.author || newMessage.author.bot)
                return;
            if (!oldMessage.content || !newMessage.content)
                return;
            if (oldMessage.content === newMessage.content)
                return;
            if (bot.channelManager && newMessage.guild) {
                const embed = embed_1.EmbedManager.createLogEmbed('Message Edited', `${helpers_1.HelperUtils.formatUserTag(newMessage.author)} edited a message in ${newMessage.channel}`, [
                    {
                        name: 'Old Content',
                        value: validation_1.ValidationManager.truncateText(oldMessage.content, 1000),
                        inline: false
                    },
                    {
                        name: 'New Content',
                        value: validation_1.ValidationManager.truncateText(newMessage.content, 1000),
                        inline: false
                    },
                    {
                        name: 'Message Link',
                        value: `[Jump to Message](${newMessage.url})`,
                        inline: true
                    }
                ]);
                await bot.channelManager.sendLog('voiceLogs', embed);
            }
        }
        catch (error) {
            logger.error('Error in messageUpdate event:', error);
        }
    });
}
const discord_js_2 = require("discord.js");
function messageDeleteEvent(bot) {
    bot.client.on(discord_js_2.Events.MessageDelete, async (message) => {
        try {
            if (!message.author || message.author.bot)
                return;
            if (bot.channelManager && message.guild && message.content) {
                const embed = embed_1.EmbedManager.createLogEmbed('Message Deleted', `A message by ${helpers_1.HelperUtils.formatUserTag(message.author)} was deleted in ${message.channel}`, [
                    {
                        name: 'Content',
                        value: validation_1.ValidationManager.truncateText(message.content, 1000),
                        inline: false
                    },
                    {
                        name: 'Channel',
                        value: message.channel.toString(),
                        inline: true
                    },
                    {
                        name: 'Deleted At',
                        value: helpers_1.HelperUtils.formatTimestamp(new Date()),
                        inline: true
                    }
                ]);
                await bot.channelManager.sendLog('voiceLogs', embed);
            }
        }
        catch (error) {
            logger.error('Error in messageDelete event:', error);
        }
    });
}
//# sourceMappingURL=messageUpdate.js.map