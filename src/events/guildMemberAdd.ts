// ===== src/events/guildMemberAdd.ts =====
import { GuildMember, Events, Client } from 'discord.js';
import { CorelinksBot } from '../bot';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';
import { HelperUtils } from '@utils/helpers';

const logger = new Logger('GuildMemberAddEvent');

export function guildMemberAddEvent(bot: CorelinksBot) {
  bot.client.on(Events.GuildMemberAdd, async (member) => {
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
  })
};