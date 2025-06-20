"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderationCommands = void 0;
const discord_js_1 = require("discord.js");
const index_1 = require("@modules/moderation/index");
const embed_1 = require("@utils/embed");
const permissions_1 = require("@utils/permissions");
const features_1 = require("@config/features");
exports.moderationCommands = [
    {
        data: new discord_js_1.SlashCommandBuilder()
            .setName('warn')
            .setDescription('Warn a user')
            .addUserOption(option => option
            .setName('user')
            .setDescription('User to warn')
            .setRequired(true))
            .addStringOption(option => option
            .setName('reason')
            .setDescription('Reason for the warning')
            .setRequired(true))
            .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers),
        async execute(interaction, bot) {
            if (!features_1.FeatureManager.isEnabled('moderation')) {
                const disabledEmbed = embed_1.EmbedManager.createErrorEmbed('Feature Disabled', 'The moderation system is currently disabled.');
                await interaction.reply({ embeds: [disabledEmbed], ephemeral: true });
                return;
            }
            const moderationManager = new index_1.ModerationManager(bot);
            const target = interaction.options.getMember('user');
            const reason = interaction.options.getString('reason', true);
            if (!target) {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('User Not Found', 'The specified user is not in this server.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }
            if (!permissions_1.PermissionManager.isStaff(interaction.member)) {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only staff members can use moderation commands.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }
            const success = await moderationManager.warnUser(target, interaction.member, reason);
            if (success) {
                const successEmbed = embed_1.EmbedManager.createSuccessEmbed('User Warned', `${'user' in target && target.user ? target.user.tag : 'The user'} has been warned.`);
                await interaction.reply({ embeds: [successEmbed], ephemeral: true });
            }
            else {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Warning Failed', 'Failed to warn the user. Check permissions and try again.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
    {
        data: new discord_js_1.SlashCommandBuilder()
            .setName('timeout')
            .setDescription('Timeout a user')
            .addUserOption(option => option
            .setName('user')
            .setDescription('User to timeout')
            .setRequired(true))
            .addStringOption(option => option
            .setName('duration')
            .setDescription('Duration (e.g., 1h, 30m, 2d)')
            .setRequired(true))
            .addStringOption(option => option
            .setName('reason')
            .setDescription('Reason for the timeout')
            .setRequired(true))
            .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers),
        async execute(interaction, bot) {
            if (!features_1.FeatureManager.isEnabled('moderation')) {
                const disabledEmbed = embed_1.EmbedManager.createErrorEmbed('Feature Disabled', 'The moderation system is currently disabled.');
                await interaction.reply({ embeds: [disabledEmbed], ephemeral: true });
                return;
            }
            const moderationManager = new index_1.ModerationManager(bot);
            const target = interaction.options.getMember('user');
            const durationStr = interaction.options.getString('duration', true);
            const reason = interaction.options.getString('reason', true);
            if (!target) {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('User Not Found', 'The specified user is not in this server.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }
            if (!permissions_1.PermissionManager.isStaff(interaction.member)) {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only staff members can use moderation commands.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }
            const duration = parseDuration(durationStr);
            if (!duration) {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Invalid Duration', 'Please provide a valid duration (e.g., 1h, 30m, 2d).');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }
            const success = await moderationManager.timeoutUser(target, interaction.member, duration, reason);
            if (success) {
                const successEmbed = embed_1.EmbedManager.createSuccessEmbed('User Timed Out', `${'user' in target && target.user ? target.user.tag : 'The user'} has been timed out for ${durationStr}.`);
                await interaction.reply({ embeds: [successEmbed], ephemeral: true });
            }
            else {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Timeout Failed', 'Failed to timeout the user. Check permissions and try again.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
    {
        data: new discord_js_1.SlashCommandBuilder()
            .setName('kick')
            .setDescription('Kick a user from the server')
            .addUserOption(option => option
            .setName('user')
            .setDescription('User to kick')
            .setRequired(true))
            .addStringOption(option => option
            .setName('reason')
            .setDescription('Reason for the kick')
            .setRequired(true))
            .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.KickMembers),
        async execute(interaction, bot) {
            if (!features_1.FeatureManager.isEnabled('moderation')) {
                const disabledEmbed = embed_1.EmbedManager.createErrorEmbed('Feature Disabled', 'The moderation system is currently disabled.');
                await interaction.reply({ embeds: [disabledEmbed], ephemeral: true });
                return;
            }
            const moderationManager = new index_1.ModerationManager(bot);
            const target = interaction.options.getMember('user');
            const reason = interaction.options.getString('reason', true);
            if (!target) {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('User Not Found', 'The specified user is not in this server.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }
            if (!permissions_1.PermissionManager.isStaff(interaction.member)) {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only staff members can use moderation commands.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }
            const success = await moderationManager.kickUser(target, interaction.member, reason);
            if (success) {
                const successEmbed = embed_1.EmbedManager.createSuccessEmbed('User Kicked', `${'user' in target && target.user ? target.user.tag : 'The user'} has been kicked from the server.`);
                await interaction.reply({ embeds: [successEmbed], ephemeral: true });
            }
            else {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Kick Failed', 'Failed to kick the user. Check permissions and try again.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
    {
        data: new discord_js_1.SlashCommandBuilder()
            .setName('ban')
            .setDescription('Ban a user from the server')
            .addUserOption(option => option
            .setName('user')
            .setDescription('User to ban')
            .setRequired(true))
            .addStringOption(option => option
            .setName('reason')
            .setDescription('Reason for the ban')
            .setRequired(true))
            .addStringOption(option => option
            .setName('duration')
            .setDescription('Duration for temporary ban (e.g., 7d, 30d)')
            .setRequired(false))
            .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.BanMembers),
        async execute(interaction, bot) {
            if (!features_1.FeatureManager.isEnabled('moderation')) {
                const disabledEmbed = embed_1.EmbedManager.createErrorEmbed('Feature Disabled', 'The moderation system is currently disabled.');
                await interaction.reply({ embeds: [disabledEmbed], ephemeral: true });
                return;
            }
            const moderationManager = new index_1.ModerationManager(bot);
            const target = interaction.options.getUser('user', true);
            const reason = interaction.options.getString('reason', true);
            const durationStr = interaction.options.getString('duration');
            if (!permissions_1.PermissionManager.isStaff(interaction.member)) {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only staff members can use moderation commands.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }
            let duration = null;
            if (durationStr) {
                duration = parseDuration(durationStr);
                if (!duration) {
                    const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Invalid Duration', 'Please provide a valid duration (e.g., 7d, 30d).');
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                    return;
                }
            }
            const success = await moderationManager.banUser(target, interaction.member, duration, reason);
            if (success) {
                const banType = duration ? `temporarily banned for ${durationStr}` : 'permanently banned';
                const successEmbed = embed_1.EmbedManager.createSuccessEmbed('User Banned', `${target.tag} has been ${banType}.`);
                await interaction.reply({ embeds: [successEmbed], ephemeral: true });
            }
            else {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Ban Failed', 'Failed to ban the user. Check permissions and try again.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
    {
        data: new discord_js_1.SlashCommandBuilder()
            .setName('clear')
            .setDescription('Clear messages from a channel')
            .addIntegerOption(option => option
            .setName('amount')
            .setDescription('Number of messages to clear (1-100)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100))
            .addUserOption(option => option
            .setName('user')
            .setDescription('Only clear messages from this user')
            .setRequired(false))
            .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageMessages),
        async execute(interaction, bot) {
            if (!features_1.FeatureManager.isEnabled('moderation')) {
                const disabledEmbed = embed_1.EmbedManager.createErrorEmbed('Feature Disabled', 'The moderation system is currently disabled.');
                await interaction.reply({ embeds: [disabledEmbed], ephemeral: true });
                return;
            }
            const moderationManager = new index_1.ModerationManager(bot);
            const amount = interaction.options.getInteger('amount', true);
            const targetUser = interaction.options.getUser('user');
            if (!permissions_1.PermissionManager.isStaff(interaction.member)) {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only staff members can use moderation commands.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }
            const channel = interaction.channel;
            if (!channel || !channel.isTextBased()) {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Invalid Channel', 'This command can only be used in text channels.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }
            await interaction.deferReply({ ephemeral: true });
            const filter = targetUser ? (msg) => msg.author.id === targetUser.id : undefined;
            const cleared = await moderationManager.clearMessages(channel, amount, interaction.member, filter);
            const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Messages Cleared', `Successfully cleared ${cleared} message(s).`);
            await interaction.editReply({ embeds: [successEmbed] });
        }
    },
    {
        data: new discord_js_1.SlashCommandBuilder()
            .setName('mass')
            .setDescription('Mass moderation actions')
            .addSubcommand(subcommand => subcommand
            .setName('kick-role')
            .setDescription('Kick all members with a specific role')
            .addRoleOption(option => option
            .setName('role')
            .setDescription('Role to kick all members from')
            .setRequired(true))
            .addStringOption(option => option
            .setName('reason')
            .setDescription('Reason for mass kick')
            .setRequired(true)))
            .addSubcommand(subcommand => subcommand
            .setName('timeout-new')
            .setDescription('Timeout all members who joined recently')
            .addIntegerOption(option => option
            .setName('hours')
            .setDescription('Members who joined in the last X hours')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(168))
            .addStringOption(option => option
            .setName('duration')
            .setDescription('Timeout duration (e.g., 1h, 30m)')
            .setRequired(true))
            .addStringOption(option => option
            .setName('reason')
            .setDescription('Reason for mass timeout')
            .setRequired(true)))
            .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
        async execute(interaction, bot) {
            if (!features_1.FeatureManager.isEnabled('moderation')) {
                const disabledEmbed = embed_1.EmbedManager.createErrorEmbed('Feature Disabled', 'The moderation system is currently disabled.');
                await interaction.reply({ embeds: [disabledEmbed], ephemeral: true });
                return;
            }
            if (!permissions_1.PermissionManager.isFounder(interaction.member)) {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only founders can use mass moderation commands.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }
            const moderationManager = new index_1.ModerationManager(bot);
            const massActionManager = moderationManager.getMassActionManager();
            const subcommand = interaction.options.getSubcommand();
            await interaction.deferReply({ ephemeral: true });
            try {
                let result;
                switch (subcommand) {
                    case 'kick-role':
                        const role = interaction.options.getRole('role', true);
                        const kickReason = interaction.options.getString('reason', true);
                        result = await massActionManager.massKickByRole(role.id, interaction.member, kickReason);
                        break;
                    case 'timeout-new':
                        const hours = interaction.options.getInteger('hours', true);
                        const durationStr = interaction.options.getString('duration', true);
                        const timeoutReason = interaction.options.getString('reason', true);
                        const timeoutDuration = parseDuration(durationStr);
                        if (!timeoutDuration) {
                            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Invalid Duration', 'Please provide a valid duration (e.g., 1h, 30m).');
                            await interaction.editReply({ embeds: [errorEmbed] });
                            return;
                        }
                        result = await massActionManager.massTimeoutNewMembers(hours, interaction.member, timeoutReason, timeoutDuration);
                        break;
                    default:
                        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Unknown Subcommand', 'Unknown mass moderation subcommand.');
                        await interaction.editReply({ embeds: [errorEmbed] });
                        return;
                }
                const resultEmbed = embed_1.EmbedManager.createInfoEmbed('Mass Action Complete', `Mass ${subcommand} completed successfully.`);
                const massResult = (result && typeof result === 'object' && 'total' in result && 'successful' in result && 'failed' in result && 'errors' in result)
                    ? result
                    : { total: 0, successful: 0, failed: 0, errors: [] };
                resultEmbed.addFields({ name: 'Total Targets', value: massResult.total.toString(), inline: true }, { name: 'Successful', value: massResult.successful.toString(), inline: true }, { name: 'Failed', value: massResult.failed.toString(), inline: true });
                if (massResult.errors.length > 0) {
                    resultEmbed.addFields({
                        name: 'Errors (First 3)',
                        value: massResult.errors.slice(0, 3).join('\n').substring(0, 1000),
                        inline: false
                    });
                }
                await interaction.editReply({ embeds: [resultEmbed] });
            }
            catch (error) {
                console.error('Error in mass moderation:', error);
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Mass Action Failed', 'An error occurred during the mass moderation action.');
                await interaction.editReply({ embeds: [errorEmbed] });
            }
        }
    }
];
function parseDuration(duration) {
    const regex = /^(\d+)([smhd])$/i;
    const match = duration.match(regex);
    if (!match)
        return null;
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
//# sourceMappingURL=moderation.js.map