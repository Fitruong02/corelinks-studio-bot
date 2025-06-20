// ===== src/events/ready.ts =====
import { Client, Events } from 'discord.js';
import { CorelinksBot } from '../bot';
import { Logger } from '@utils/logger';

const logger = new Logger('ReadyEvent');

export const readyEvent = {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client, bot: CorelinksBot) {
    try {
      logger.info(`Bot is ready! Logged in as ${client.user?.tag}`);
      
      // Initialize channel manager
      await bot.initializeChannelManager();
      
      // Set bot activity
      client.user?.setActivity('Corelinks Studio', { type: 0 });
      
      logger.info('Corelinks Studio Discord Bot is now operational');
    } catch (error) {
      logger.error('Error in ready event:', error);
    }
  }
};