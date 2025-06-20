// ===== src/config/channels.ts =====
import { TextChannel, Guild } from 'discord.js';
import { config } from '@config/config';
import { Logger } from '@utils/logger';

export class ChannelManager {
  private guild: Guild;
  private logger: Logger;
  private channels: Map<string, TextChannel> = new Map();

  constructor(guild: Guild) {
    this.guild = guild;
    this.logger = new Logger('ChannelManager');
  }

  async initializeChannels(): Promise<void> {
    const channelIds = config.channels;
    
    try {
      for (const [name, id] of Object.entries(channelIds)) {
        const channel = await this.guild.channels.fetch(id) as TextChannel;
        if (channel) {
          this.channels.set(name, channel);
          this.logger.debug(`Initialized channel: ${name} (${id})`);
        } else {
          this.logger.warn(`Channel not found: ${name} (${id})`);
        }
      }
      this.logger.info(`Initialized ${this.channels.size} channels`);
    } catch (error) {
      this.logger.error('Error initializing channels:', error);
      throw error;
    }
  }

  getChannel(name: keyof typeof config.channels): TextChannel | null {
    return this.channels.get(name) || null;
  }

  async sendLog(channelName: keyof typeof config.channels, content: any): Promise<void> {
    const channel = this.getChannel(channelName);
    if (!channel) {
      this.logger.warn(`Log channel not found: ${channelName}`);
      return;
    }

    try {
      if (typeof content === 'string') {
        await channel.send(content);
      } else {
        await channel.send({ embeds: [content] });
      }
    } catch (error) {
      this.logger.error(`Failed to send log to ${channelName}:`, error);
    }
  }

  isChannelAvailable(name: keyof typeof config.channels): boolean {
    return this.channels.has(name);
  }

  refreshChannel(name: keyof typeof config.channels): Promise<void> {
    const channelId = config.channels[name];
    return this.guild.channels.fetch(channelId).then(channel => {
      if (channel) {
        this.channels.set(name, channel as TextChannel);
        this.logger.debug(`Refreshed channel: ${name}`);
      }
    }).catch(error => {
      this.logger.error(`Failed to refresh channel ${name}:`, error);
    });
  }
}

