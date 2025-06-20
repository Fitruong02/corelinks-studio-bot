// ===== src/events/messageUpdate.ts =====
import { Message, Events, PartialMessage } from 'discord.js';
import { CorelinksBot } from '../bot';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';
import { HelperUtils } from '@utils/helpers';
import { ValidationManager } from '@utils/validation';

const logger = new Logger('MessageUpdateEvent');

export function messageUpdateEvent(bot: CorelinksBot) {
  bot.client.on(Events.MessageUpdate, async (oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) => {
    try {
      // Ignore bot messages and partial messages without content
      if (!newMessage.author || newMessage.author.bot) return;
      if (!oldMessage.content || !newMessage.content) return;
      if (oldMessage.content === newMessage.content) return;

      // Log message edit
      if (bot.channelManager && newMessage.guild) {
        const embed = EmbedManager.createLogEmbed(
          'Message Edited',
          `${HelperUtils.formatUserTag(newMessage.author)} edited a message in ${newMessage.channel}`,
          [
            {
              name: 'Old Content',
              value: ValidationManager.truncateText(oldMessage.content, 1000),
              inline: false
            },
            {
              name: 'New Content',
              value: ValidationManager.truncateText(newMessage.content, 1000),
              inline: false
            },
            {
              name: 'Message Link',
              value: `[Jump to Message](${newMessage.url})`,
              inline: true
            }
          ]
        );

        await bot.channelManager.sendLog('voiceLogs', embed); // Using voiceLogs as per SRS for chat logs
      }

    } catch (error) {
      logger.error('Error in messageUpdate event:', error);
    }
  });
}
// ===== Additional event for message deletion =====
import { Events as DiscordEvents } from 'discord.js';

export function messageDeleteEvent(bot: CorelinksBot) {
  bot.client.on(DiscordEvents.MessageDelete, async (message: Message | PartialMessage) => {
    try {
      // Ignore bot messages
      if (!message.author || message.author.bot) return;

      // Log message deletion
      if (bot.channelManager && message.guild && message.content) {
        const embed = EmbedManager.createLogEmbed(
          'Message Deleted',
          `A message by ${HelperUtils.formatUserTag(message.author)} was deleted in ${message.channel}`,
          [
            {
              name: 'Content',
              value: ValidationManager.truncateText(message.content, 1000),
              inline: false
            },
            {
              name: 'Channel',
              value: message.channel.toString(),
              inline: true
            },
            {
              name: 'Deleted At',
              value: HelperUtils.formatTimestamp(new Date()),
              inline: true
            }
          ]
        );

        await bot.channelManager.sendLog('voiceLogs', embed); // Using voiceLogs as per SRS for chat logs
      }

    } catch (error) {
      logger.error('Error in messageDelete event:', error);
    }
  });
}