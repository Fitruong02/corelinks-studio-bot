// ===== src/events/messageCreate.ts =====
import { Message, Events } from 'discord.js';
import { CorelinksBot } from '../bot';
import { Logger } from '@utils/logger';
import { AutoModerationManager } from '@modules/moderation/automod';

const logger = new Logger('MessageCreateEvent');

export function messageCreateEvent(bot: CorelinksBot) {
  bot.client.on(Events.MessageCreate, async (message: Message) => {
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
  });
}
