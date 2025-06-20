// ===== Update src/events/index.ts =====
import { CorelinksBot } from '../bot';
import { Logger } from '@utils/logger';
import { Events } from 'discord.js';

// Import all event handlers
import { readyEvent } from './ready';
import { messageCreateEvent } from './messageCreate';
import { guildMemberAddEvent } from './guildMemberAdd';
import { voiceStateUpdateEvent } from './voiceStateUpdate';
import { interactionCreateEvent } from './interactionCreate';
import { messageUpdateEvent, messageDeleteEvent } from './messageUpdate';

export class EventLoader {
  private bot: CorelinksBot;
  private logger: Logger;

  constructor(bot: CorelinksBot) {
    this.bot = bot;
    this.logger = new Logger('EventLoader');
  }

  async loadEvents(): Promise<void> {
    try {
      const events = [
        readyEvent,
        messageCreateEvent,
        guildMemberAddEvent,
        voiceStateUpdateEvent,
        interactionCreateEvent,
        messageUpdateEvent,
        messageDeleteEvent
      ];

      let loadedCount = 0;

      for (const event of events) {
        // if (event.name && event.execute) {
        //   if (event.once) {
        //     this.bot.client.once(event.name as keyof import('discord.js').ClientEvents, (...args: any[]) => event.execute(...args, this.bot));
        //   } else {
        //     this.bot.client.on(event.name as keyof import('discord.js').ClientEvents, (...args: any[]) => event.execute(...args, this.bot));
        //   }
          
        //   this.logger.debug(`Loaded event: ${event.name}`);
        //   loadedCount++;
        // } else {
        //   this.logger.warn('Invalid event structure detected:', event);
        // }

        event(this.bot);
        this.logger.debug(`Loaded event: ${event.name}`);
        loadedCount++;
      }

      // Add additional event handlers
      await this.setupAdditionalEvents();

      this.logger.info(`Successfully loaded ${loadedCount} events`);

    } catch (error) {
      this.logger.error('Failed to load events:', error);
      throw error;
    }
  }

  private async setupAdditionalEvents(): Promise<void> {
    try {
      // Handle message reactions for role picker
      this.bot.client.on(Events.MessageReactionAdd, async (reaction, user) => {
        if (user.bot) return;
        
        try {
          const { RoleManager } = await import('@modules/role/index');
          const roleManager = new RoleManager(this.bot);
          
          await roleManager.handleReactionRoleToggle(
            reaction.message.id,
            user.id,
            reaction.emoji.name || reaction.emoji.id || '',
            true
          );
        } catch (error) {
          this.logger.error('Error handling reaction add:', error);
        }
      });

      this.bot.client.on(Events.MessageReactionRemove, async (reaction, user) => {
        if (user.bot) return;
        
        try {
          const { RoleManager } = await import('@modules/role/index');
          const roleManager = new RoleManager(this.bot);
          
          await roleManager.handleReactionRoleToggle(
            reaction.message.id,
            user.id,
            reaction.emoji.name || reaction.emoji.id || '',
            false
          );
        } catch (error) {
          this.logger.error('Error handling reaction remove:', error);
        }
      });

      // Handle guild member remove
      this.bot.client.on(Events.GuildMemberRemove, async (member) => {
        try {
          const { LoggingManager } = await import('@modules/logging/index');
          const loggingManager = new LoggingManager(this.bot);
          
          await loggingManager.logJoinLeave(member as any, 'leave');
        } catch (error) {
          this.logger.error('Error handling member leave:', error);
        }
      });

      // Handle invite tracking
      this.bot.client.on(Events.GuildMemberAdd, async (member) => {
        try {
          const { LoggingManager } = await import('@modules/logging/index');
          const loggingManager = new LoggingManager(this.bot);
          
          // Detect which invite was used
          const inviteUsed = await loggingManager.detectInviteUsed(member.guild.id);
          await loggingManager.logJoinLeave(member, 'join', inviteUsed || undefined);
          
          // Update analytics
          const { AnalyticsManager } = await import('@modules/analytics/index');
          const analyticsManager = new AnalyticsManager(this.bot);
          await analyticsManager.recordMemberGrowth(1);
          
        } catch (error) {
          this.logger.error('Error handling member join with analytics:', error);
        }
      });

      // Handle DM messages for anonymous ticket system
      this.bot.client.on(Events.MessageCreate, async (message) => {
        if (message.author.bot || message.guild) return; // Only DMs
        
        try {
          const { AnonymousManager } = await import('@modules/ticket/anonymous');
          const anonymousManager = new AnonymousManager(this.bot);
          
          await anonymousManager.handleCustomerDM(message);
        } catch (error) {
          this.logger.error('Error handling DM for ticket system:', error);
        }
      });

      this.logger.debug('Additional event handlers setup completed');

    } catch (error) {
      this.logger.error('Failed to setup additional events:', error);
    }
  }
}