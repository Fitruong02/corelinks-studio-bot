"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorelinksBot = void 0;
const discord_js_1 = require("discord.js");
const config_1 = require("@config/config");
const channels_1 = require("@config/channels");
const logger_1 = require("@utils/logger");
const index_1 = require("@commands/index");
const index_2 = require("@events/index");
class CorelinksBot {
    client;
    commands;
    channelManager = null;
    logger;
    commandLoader;
    eventLoader;
    constructor() {
        this.logger = new logger_1.Logger('CorelinksBot');
        this.client = new discord_js_1.Client({
            intents: [
                discord_js_1.GatewayIntentBits.Guilds,
                discord_js_1.GatewayIntentBits.GuildMessages,
                discord_js_1.GatewayIntentBits.MessageContent,
                discord_js_1.GatewayIntentBits.GuildMembers,
                discord_js_1.GatewayIntentBits.GuildVoiceStates,
                discord_js_1.GatewayIntentBits.GuildMessageReactions,
                discord_js_1.GatewayIntentBits.DirectMessages,
                discord_js_1.GatewayIntentBits.GuildInvites
            ]
        });
        this.commands = new discord_js_1.Collection();
        this.commandLoader = new index_1.CommandLoader(this);
        this.eventLoader = new index_2.EventLoader(this);
    }
    async initialize() {
        try {
            this.logger.info('Initializing bot...');
            await this.commandLoader.loadCommands();
            this.logger.info(`Loaded ${this.commands.size} commands`);
            await this.eventLoader.loadEvents();
            this.logger.info('Events loaded successfully');
            await this.registerSlashCommands();
            this.logger.info('Bot initialization completed');
        }
        catch (error) {
            this.logger.error('Failed to initialize bot:', error);
            throw error;
        }
    }
    async start() {
        try {
            await this.client.login(config_1.config.discord.token);
        }
        catch (error) {
            this.logger.error('Failed to start bot:', error);
            throw error;
        }
    }
    async registerSlashCommands() {
        try {
            const rest = new discord_js_1.REST({ version: '10' }).setToken(config_1.config.discord.token);
            const commands = Array.from(this.commands.values()).map(cmd => cmd.data);
            await rest.put(discord_js_1.Routes.applicationGuildCommands(config_1.config.discord.clientId, config_1.config.discord.guildId), { body: commands });
            this.logger.info('Slash commands registered successfully');
        }
        catch (error) {
            this.logger.error('Failed to register slash commands:', error);
            throw error;
        }
    }
    async initializeChannelManager() {
        const guild = this.client.guilds.cache.get(config_1.config.discord.guildId);
        if (!guild) {
            throw new Error('Guild not found');
        }
        this.channelManager = new channels_1.ChannelManager(guild);
        await this.channelManager.initializeChannels();
        this.logger.info('Channel manager initialized');
    }
}
exports.CorelinksBot = CorelinksBot;
//# sourceMappingURL=bot.js.map