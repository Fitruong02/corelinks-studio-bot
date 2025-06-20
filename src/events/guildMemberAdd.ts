// ===== src/events/guildMemberAdd.ts =====
import { GuildMember, Events } from 'discord.js';
import { CorelinksBot } from '../bot';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';
import { HelperUtils } from '@utils/helpers';

const logger = new Logger('GuildMemberAddEvent');

export const guildMemberAddEvent = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member: GuildMember, bot: CorelinksBot) {
    try {
      if (!bot.channelManager) return;
      
      // Log member join
      const joinEmbed = EmbedManager.createLogEmbed(
        '📥 Member Joined',
        `${HelperUtils.formatUserTag(member)} joined the server`,
        [
          { name: 'Account Created', value: HelperUtils.formatTimestamp(member.user.createdAt), inline: true },
          { name: 'Member Count', value: member.guild.memberCount.toString(), inline: true }
        ]
      );
      
      await bot.channelManager.sendLog('joinLeave', joinEmbed);
      
      // Update analytics
      // Note: Member growth will be calculated weekly
      
      logger.info(`Member joined: ${HelperUtils.formatUserTag(member)}`);
    } catch (error) {
      logger.error('Error in guildMemberAdd event:', error);
    }
  }
};