// ===== src/bot.ts =====
import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import { config } from '@config/config';
import { ChannelManager } from '@config/channels';
import { Logger } from '@utils/logger';
import { CommandLoader } from '@commands/index';
import { EventLoader } from '@events/index';

export class CorelinksBot {
  public client: Client;
  public commands: Collection<string, any>;
  public channelManager: ChannelManager | null = null;
  private logger: Logger;
  private commandLoader: CommandLoader;
  private eventLoader: EventLoader;

  constructor() {
    this.logger = new Logger('CorelinksBot');
    
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildInvites
      ]
    });

    this.commands = new Collection();
    this.commandLoader = new CommandLoader(this);
    this.eventLoader = new EventLoader(this);
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing bot...');

      // Load commands
      await this.commandLoader.loadCommands();
      this.logger.info(`Loaded ${this.commands.size} commands`);

      // Load events
      await this.eventLoader.loadEvents();
      this.logger.info('Events loaded successfully');

      // Register slash commands
      await this.registerSlashCommands();
      
      this.logger.info('Bot initialization completed');
    } catch (error) {
      this.logger.error('Failed to initialize bot:', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    try {
      await this.client.login(config.discord.token);
    } catch (error) {
      this.logger.error('Failed to start bot:', error);
      throw error;
    }
  }

  async registerSlashCommands(): Promise<void> {
    try {
      const rest = new REST({ version: '10' }).setToken(config.discord.token);
      const commands = Array.from(this.commands.values()).map(cmd => cmd.data);

      await rest.put(
        Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
        { body: commands }
      );

      this.logger.info('Slash commands registered successfully');
    } catch (error) {
      this.logger.error('Failed to register slash commands:', error);
      throw error;
    }
  }

  async initializeChannelManager(): Promise<void> {
    const guild = this.client.guilds.cache.get(config.discord.guildId);
    if (!guild) {
      throw new Error('Guild not found');
    }

    this.channelManager = new ChannelManager(guild);
    await this.channelManager.initializeChannels();
    this.logger.info('Channel manager initialized');
  }
}