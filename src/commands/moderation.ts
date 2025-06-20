import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { CorelinksBot } from '../bot';
import { ModerationManager } from '@modules/moderation/index';
import { EmbedManager } from '@utils/embed';
import { PermissionManager } from '@utils/permissions';
import { FeatureManager } from '@config/features';

export const moderationCommands = [
  {
    data: new SlashCommandBuilder()
      .setName('warn')
      .setDescription('Warn a user')
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('User to warn')
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('reason')
          .setDescription('Reason for the warning')
          .setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction: ChatInputCommandInteraction, bot: CorelinksBot) {
      if (!FeatureManager.isEnabled('moderation')) {
        const disabledEmbed = EmbedManager.createErrorEmbed(
          'Feature Disabled',
          'The moderation system is currently disabled.'
        );
        await interaction.reply({ embeds: [disabledEmbed], ephemeral: true });
        return;
      }

      const moderationManager = new ModerationManager(bot);
      const target = interaction.options.getMember('user');
      const reason = interaction.options.getString('reason', true);

      if (!target) {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'User Not Found',
          'The specified user is not in this server.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
      }

      if (!PermissionManager.isStaff(interaction.member as any)) {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'Permission Denied',
          'Only staff members can use moderation commands.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
      }

      const success = await moderationManager.warnUser(target as any, interaction.member as any, reason);

      if (success) {
        const successEmbed = EmbedManager.createSuccessEmbed(
          'User Warned',
          `${'user' in target && target.user ? target.user.tag : 'The user'} has been warned.`
        );
        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
      } else {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'Warning Failed',
          'Failed to warn the user. Check permissions and try again.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('timeout')
      .setDescription('Timeout a user')
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('User to timeout')
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('duration')
          .setDescription('Duration (e.g., 1h, 30m, 2d)')
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('reason')
          .setDescription('Reason for the timeout')
          .setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction: ChatInputCommandInteraction, bot: CorelinksBot) {
      if (!FeatureManager.isEnabled('moderation')) {
        const disabledEmbed = EmbedManager.createErrorEmbed(
          'Feature Disabled',
          'The moderation system is currently disabled.'
        );
        await interaction.reply({ embeds: [disabledEmbed], ephemeral: true });
        return;
      }

      const moderationManager = new ModerationManager(bot);
      const target = interaction.options.getMember('user');
      const durationStr = interaction.options.getString('duration', true);
      const reason = interaction.options.getString('reason', true);

      if (!target) {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'User Not Found',
          'The specified user is not in this server.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
      }

      if (!PermissionManager.isStaff(interaction.member as any)) {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'Permission Denied',
          'Only staff members can use moderation commands.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
      }

      const duration = parseDuration(durationStr);
      if (!duration) {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'Invalid Duration',
          'Please provide a valid duration (e.g., 1h, 30m, 2d).'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
      }

      const success = await moderationManager.timeoutUser(target as any, interaction.member as any, duration, reason);

      if (success) {
        const successEmbed = EmbedManager.createSuccessEmbed(
          'User Timed Out',
          `${'user' in target && target.user ? target.user.tag : 'The user'} has been timed out for ${durationStr}.`
        );
        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
      } else {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'Timeout Failed',
          'Failed to timeout the user. Check permissions and try again.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('kick')
      .setDescription('Kick a user from the server')
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('User to kick')
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('reason')
          .setDescription('Reason for the kick')
          .setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction: ChatInputCommandInteraction, bot: CorelinksBot) {
      if (!FeatureManager.isEnabled('moderation')) {
        const disabledEmbed = EmbedManager.createErrorEmbed(
          'Feature Disabled',
          'The moderation system is currently disabled.'
        );
        await interaction.reply({ embeds: [disabledEmbed], ephemeral: true });
        return;
      }

      const moderationManager = new ModerationManager(bot);
      const target = interaction.options.getMember('user');
      const reason = interaction.options.getString('reason', true);

      if (!target) {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'User Not Found',
          'The specified user is not in this server.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
      }

      if (!PermissionManager.isStaff(interaction.member as any)) {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'Permission Denied',
          'Only staff members can use moderation commands.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
      }

      const success = await moderationManager.kickUser(target as any, interaction.member as any, reason);

      if (success) {
        const successEmbed = EmbedManager.createSuccessEmbed(
          'User Kicked',
          `${'user' in target && target.user ? target.user.tag : 'The user'} has been kicked from the server.`
        );
        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
      } else {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'Kick Failed',
          'Failed to kick the user. Check permissions and try again.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('ban')
      .setDescription('Ban a user from the server')
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('User to ban')
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('reason')
          .setDescription('Reason for the ban')
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('duration')
          .setDescription('Duration for temporary ban (e.g., 7d, 30d)')
          .setRequired(false)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction: ChatInputCommandInteraction, bot: CorelinksBot) {
      if (!FeatureManager.isEnabled('moderation')) {
        const disabledEmbed = EmbedManager.createErrorEmbed(
          'Feature Disabled',
          'The moderation system is currently disabled.'
        );
        await interaction.reply({ embeds: [disabledEmbed], ephemeral: true });
        return;
      }

      const moderationManager = new ModerationManager(bot);
      const target = interaction.options.getUser('user', true);
      const reason = interaction.options.getString('reason', true);
      const durationStr = interaction.options.getString('duration');

      if (!PermissionManager.isStaff(interaction.member as any)) {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'Permission Denied',
          'Only staff members can use moderation commands.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
      }

      let duration: number | null = null;
      if (durationStr) {
        duration = parseDuration(durationStr);
        if (!duration) {
          const errorEmbed = EmbedManager.createErrorEmbed(
            'Invalid Duration',
            'Please provide a valid duration (e.g., 7d, 30d).'
          );
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
          return;
        }
      }

      const success = await moderationManager.banUser(target, interaction.member as any, duration, reason);

      if (success) {
        const banType = duration ? `temporarily banned for ${durationStr}` : 'permanently banned';
        const successEmbed = EmbedManager.createSuccessEmbed(
          'User Banned',
          `${target.tag} has been ${banType}.`
        );
        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
      } else {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'Ban Failed',
          'Failed to ban the user. Check permissions and try again.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('clear')
      .setDescription('Clear messages from a channel')
      .addIntegerOption(option =>
        option
          .setName('amount')
          .setDescription('Number of messages to clear (1-100)')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(100)
      )
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('Only clear messages from this user')
          .setRequired(false)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction: ChatInputCommandInteraction, bot: CorelinksBot) {
      if (!FeatureManager.isEnabled('moderation')) {
        const disabledEmbed = EmbedManager.createErrorEmbed(
          'Feature Disabled',
          'The moderation system is currently disabled.'
        );
        await interaction.reply({ embeds: [disabledEmbed], ephemeral: true });
        return;
      }

      const moderationManager = new ModerationManager(bot);
      const amount = interaction.options.getInteger('amount', true);
      const targetUser = interaction.options.getUser('user');

      if (!PermissionManager.isStaff(interaction.member as any)) {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'Permission Denied',
          'Only staff members can use moderation commands.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
      }

      const channel = interaction.channel;
      if (!channel || !channel.isTextBased()) {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'Invalid Channel',
          'This command can only be used in text channels.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
      }

      await interaction.deferReply({ ephemeral: true });

      const filter = targetUser ? (msg: any) => msg.author.id === targetUser.id : undefined;
      const cleared = await moderationManager.clearMessages(channel as any, amount, interaction.member as any, filter);

      const successEmbed = EmbedManager.createSuccessEmbed(
        'Messages Cleared',
        `Successfully cleared ${cleared} message(s).`
      );

      await interaction.editReply({ embeds: [successEmbed] });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('mass')
      .setDescription('Mass moderation actions')
      .addSubcommand(subcommand =>
        subcommand
          .setName('kick-role')
          .setDescription('Kick all members with a specific role')
          .addRoleOption(option =>
            option
              .setName('role')
              .setDescription('Role to kick all members from')
              .setRequired(true)
          )
          .addStringOption(option =>
            option
              .setName('reason')
              .setDescription('Reason for mass kick')
              .setRequired(true)
          )
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName('timeout-new')
          .setDescription('Timeout all members who joined recently')
          .addIntegerOption(option =>
            option
              .setName('hours')
              .setDescription('Members who joined in the last X hours')
              .setRequired(true)
              .setMinValue(1)
              .setMaxValue(168)
          )
          .addStringOption(option =>
            option
              .setName('duration')
              .setDescription('Timeout duration (e.g., 1h, 30m)')
              .setRequired(true)
          )
          .addStringOption(option =>
            option
              .setName('reason')
              .setDescription('Reason for mass timeout')
              .setRequired(true)
          )
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction, bot: CorelinksBot) {
      if (!FeatureManager.isEnabled('moderation')) {
        const disabledEmbed = EmbedManager.createErrorEmbed(
          'Feature Disabled',
          'The moderation system is currently disabled.'
        );
        await interaction.reply({ embeds: [disabledEmbed], ephemeral: true });
        return;
      }

      if (!PermissionManager.isFounder(interaction.member as any)) {
        const errorEmbed = EmbedManager.createErrorEmbed(
          'Permission Denied',
          'Only founders can use mass moderation commands.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
      }

      const moderationManager = new ModerationManager(bot);
      const massActionManager = moderationManager.getMassActionManager();
      const subcommand = interaction.options.getSubcommand();

      await interaction.deferReply({ ephemeral: true });

      try {
        let result;

        switch (subcommand) {
          case 'kick-role':
            const role = interaction.options.getRole('role', true);
            const kickReason = interaction.options.getString('reason', true);
            result = await massActionManager.massKickByRole(role.id, interaction.member as any, kickReason);
            break;
          case 'timeout-new':
            const hours = interaction.options.getInteger('hours', true);
            const durationStr = interaction.options.getString('duration', true);
            const timeoutReason = interaction.options.getString('reason', true);
            const timeoutDuration = parseDuration(durationStr);
            
            if (!timeoutDuration) {
              const errorEmbed = EmbedManager.createErrorEmbed(
                'Invalid Duration',
                'Please provide a valid duration (e.g., 1h, 30m).'
              );
              await interaction.editReply({ embeds: [errorEmbed] });
              return;
            }
            
            result = await massActionManager.massTimeoutNewMembers(hours, interaction.member as any, timeoutReason, timeoutDuration);
            break;
          default:
            const errorEmbed = EmbedManager.createErrorEmbed(
              'Unknown Subcommand',
              'Unknown mass moderation subcommand.'
            );
            await interaction.editReply({ embeds: [errorEmbed] });
            return;
        }

        const resultEmbed = EmbedManager.createInfoEmbed(
          'Mass Action Complete',
          `Mass ${subcommand} completed successfully.`
        );

        // For mass action result, check if result is an object with the expected properties
        const massResult = (result && typeof result === 'object' && 'total' in result && 'successful' in result && 'failed' in result && 'errors' in result)
          ? (result as MassActionResult)
          : { total: 0, successful: 0, failed: 0, errors: [] };
        resultEmbed.addFields(
          { name: 'Total Targets', value: massResult.total.toString(), inline: true },
          { name: 'Successful', value: massResult.successful.toString(), inline: true },
          { name: 'Failed', value: massResult.failed.toString(), inline: true }
        );

        if (massResult.errors.length > 0) {
          resultEmbed.addFields({
            name: 'Errors (First 3)',
            value: massResult.errors.slice(0, 3).join('\n').substring(0, 1000),
            inline: false
          });
        }

        await interaction.editReply({ embeds: [resultEmbed] });

      } catch (error) {
        console.error('Error in mass moderation:', error);
        const errorEmbed = EmbedManager.createErrorEmbed(
          'Mass Action Failed',
          'An error occurred during the mass moderation action.'
        );
        await interaction.editReply({ embeds: [errorEmbed] });
      }
    }
  }
];

// Define a type for the expected result object
interface MassActionResult {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

function parseDuration(duration: string): number | null {
  const regex = /^(\d+)([smhd])$/i;
  const match = duration.match(regex);
  
  if (!match) return null;
  
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return null;
  }
}
