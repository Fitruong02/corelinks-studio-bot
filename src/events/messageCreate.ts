// ===== src/events/messageCreate.ts =====
import { Message, Events } from 'discord.js';
import { CorelinksBot } from '../bot';
import { Logger } from '@utils/logger';
import { AutoModerationManager } from '@modules/moderation/automod';

const logger = new Logger('MessageCreateEvent');

export const messageCreateEvent = {
  name: Events.MessageCreate,
  once: false,
  async execute(message: Message, bot: CorelinksBot) {
    try {
      // Ignore bot messages
      if (message.author.bot) return;
      
      // Ignore DMs for automod
      if (!message.guild) return;
      
      // Run auto-moderation checks
      const automod = new AutoModerationManager(bot);
      await automod.processMessage(message);
      
    } catch (error) {
      logger.error('Error in messageCreate event:', error);
    }
  }
};
