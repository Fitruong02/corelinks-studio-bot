"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelManager = void 0;
const config_1 = require("@config/config");
const logger_1 = require("@utils/logger");
class ChannelManager {
    guild;
    logger;
    channels = new Map();
    constructor(guild) {
        this.guild = guild;
        this.logger = new logger_1.Logger('ChannelManager');
    }
    async initializeChannels() {
        const channelIds = config_1.config.channels;
        try {
            for (const [name, id] of Object.entries(channelIds)) {
                const channel = await this.guild.channels.fetch(id);
                if (channel) {
                    this.channels.set(name, channel);
                    this.logger.debug(`Initialized channel: ${name} (${id})`);
                }
                else {
                    this.logger.warn(`Channel not found: ${name} (${id})`);
                }
            }
            this.logger.info(`Initialized ${this.channels.size} channels`);
        }
        catch (error) {
            this.logger.error('Error initializing channels:', error);
            throw error;
        }
    }
    getChannel(name) {
        return this.channels.get(name) || null;
    }
    async sendLog(channelName, content) {
        const channel = this.getChannel(channelName);
        if (!channel) {
            this.logger.warn(`Log channel not found: ${channelName}`);
            return;
        }
        try {
            if (typeof content === 'string') {
                await channel.send(content);
            }
            else {
                await channel.send({ embeds: [content] });
            }
        }
        catch (error) {
            this.logger.error(`Failed to send log to ${channelName}:`, error);
        }
    }
    isChannelAvailable(name) {
        return this.channels.has(name);
    }
    refreshChannel(name) {
        const channelId = config_1.config.channels[name];
        return this.guild.channels.fetch(channelId).then(channel => {
            if (channel) {
                this.channels.set(name, channel);
                this.logger.debug(`Refreshed channel: ${name}`);
            }
        }).catch(error => {
            this.logger.error(`Failed to refresh channel ${name}:`, error);
        });
    }
}
exports.ChannelManager = ChannelManager;
//# sourceMappingURL=channels.js.map