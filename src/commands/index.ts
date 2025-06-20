// ===== src/commands/index.ts =====
import { CorelinksBot } from '../bot';
import { Logger } from '@utils/logger';
import { FeatureManager } from '../config/features';

// Import all command modules
import { ticketCommands } from './ticket';
import { paymentCommands } from './payment';
import { moderationCommands } from './moderation';
import { voiceCommands } from './voice';
import { roleCommands as alertRoleCommands } from './alert';
import { roleCommands } from './role';

export class CommandLoader {
  private bot: CorelinksBot;
  private logger: Logger;

  constructor(bot: CorelinksBot) {
    this.bot = bot;
    this.logger = new Logger('CommandLoader');
  }

  async loadCommands(): Promise<void> {
    try {
      // Collect all commands based on enabled features
      const allCommands: any[] = [];

      // Ticket system commands
      if (FeatureManager.isEnabled('ticketSystem')) {
        allCommands.push(...ticketCommands);
        this.logger.debug('Loaded ticket commands');
      }

      // Payment system commands
      if (FeatureManager.isEnabled('paymentSystem')) {
        allCommands.push(...paymentCommands);
        this.logger.debug('Loaded payment commands');
      }

      // Moderation commands
      if (FeatureManager.isEnabled('moderation')) {
        allCommands.push(...moderationCommands);
        this.logger.debug('Loaded moderation commands');
      }

      // Voice management commands
      if (FeatureManager.isEnabled('voiceManagement')) {
        allCommands.push(...voiceCommands);
        this.logger.debug('Loaded voice commands');
      }

      // Alert system commands
      if (FeatureManager.isEnabled('alertSystem')) {
        allCommands.push(...alertRoleCommands);
        this.logger.debug('Loaded alert commands');
      }

      // Role management commands
      if (FeatureManager.isEnabled('roleManagement')) {
        allCommands.push(...roleCommands);
        this.logger.debug('Loaded role commands');
      }

      // Register each command
      for (const command of allCommands) {
        if (command.data && command.execute) {
          this.bot.commands.set(command.data.name, command);
          this.logger.debug(`Registered command: ${command.data.name}`);
        } else {
          this.logger.warn('Invalid command structure detected:', command);
        }
      }

      this.logger.info(`Successfully loaded ${this.bot.commands.size} commands`);

    } catch (error) {
      this.logger.error('Failed to load commands:', error);
      throw error;
    }
  }

  getCommand(name: string) {
    return this.bot.commands.get(name);
  }

  getAllCommands() {
    return Array.from(this.bot.commands.values());
  }

  getEnabledFeatures(): string[] {
    return FeatureManager.getEnabledFeatures();
  }

  getDisabledFeatures(): string[] {
    return FeatureManager.getDisabledFeatures();
  }
}