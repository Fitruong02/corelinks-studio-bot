"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleCommands = void 0;
const discord_js_1 = require("discord.js");
const index_1 = require("@modules/role/index");
const embed_1 = require("@utils/embed");
const permissions_1 = require("@utils/permissions");
const features_1 = require("../config/features");
exports.roleCommands = [
    {
        data: new discord_js_1.SlashCommandBuilder()
            .setName('role')
            .setDescription('Role management commands')
            .addSubcommand(subcommand => subcommand
            .setName('add')
            .setDescription('Add a role to a user')
            .addUserOption(option => option
            .setName('user')
            .setDescription('User to add role to')
            .setRequired(true))
            .addRoleOption(option => option
            .setName('role')
            .setDescription('Role to add')
            .setRequired(true)))
            .addSubcommand(subcommand => subcommand
            .setName('remove')
            .setDescription('Remove a role from a user')
            .addUserOption(option => option
            .setName('user')
            .setDescription('User to remove role from')
            .setRequired(true))
            .addRoleOption(option => option
            .setName('role')
            .setDescription('Role to remove')
            .setRequired(true)))
            .addSubcommand(subcommand => subcommand
            .setName('mass-add')
            .setDescription('Add a role to all users with another role')
            .addRoleOption(option => option
            .setName('target-role')
            .setDescription('Role to add to users')
            .setRequired(true))
            .addRoleOption(option => option
            .setName('filter-role')
            .setDescription('Users with this role will get the target role')
            .setRequired(true)))
            .addSubcommand(subcommand => subcommand
            .setName('mass-remove')
            .setDescription('Remove a role from all users with another role')
            .addRoleOption(option => option
            .setName('target-role')
            .setDescription('Role to remove from users')
            .setRequired(true))
            .addRoleOption(option => option
            .setName('filter-role')
            .setDescription('Users with this role will lose the target role')
            .setRequired(true)))
            .addSubcommand(subcommand => subcommand
            .setName('info')
            .setDescription('Get information about a role')
            .addRoleOption(option => option
            .setName('role')
            .setDescription('Role to get info about')
            .setRequired(true))),
        async execute(interaction, bot) {
            if (!features_1.FeatureManager.isEnabled('roleManagement')) {
                const disabledEmbed = embed_1.EmbedManager.createErrorEmbed('Feature Disabled', 'Role management is currently disabled.');
                await interaction.reply({ embeds: [disabledEmbed], ephemeral: true });
                return;
            }
            if (!permissions_1.PermissionManager.isStaff(interaction.member)) {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only staff members can manage roles.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }
            const roleManager = new index_1.RoleManager(bot);
            const subcommand = interaction.options.getSubcommand();
            switch (subcommand) {
                case 'add':
                    await handleRoleAdd(interaction, roleManager);
                    break;
                case 'remove':
                    await handleRoleRemove(interaction, roleManager);
                    break;
                case 'mass-add':
                    await handleRoleMassAdd(interaction, roleManager);
                    break;
                case 'mass-remove':
                    await handleRoleMassRemove(interaction, roleManager);
                    break;
                case 'info':
                    await handleRoleInfo(interaction, roleManager);
                    break;
            }
        }
    },
    {
        data: new discord_js_1.SlashCommandBuilder()
            .setName('rolepicker')
            .setDescription('Role picker management')
            .addSubcommand(subcommand => subcommand
            .setName('create')
            .setDescription('Create a new role picker message')
            .addStringOption(option => option
            .setName('title')
            .setDescription('Title for the role picker')
            .setRequired(true))
            .addStringOption(option => option
            .setName('description')
            .setDescription('Description for the role picker')
            .setRequired(false)))
            .addSubcommand(subcommand => subcommand
            .setName('add-role')
            .setDescription('Add a role to an existing role picker')
            .addStringOption(option => option
            .setName('message-id')
            .setDescription('ID of the role picker message')
            .setRequired(true))
            .addRoleOption(option => option
            .setName('role')
            .setDescription('Role to add')
            .setRequired(true))
            .addStringOption(option => option
            .setName('emoji')
            .setDescription('Emoji for this role')
            .setRequired(true))
            .addStringOption(option => option
            .setName('description')
            .setDescription('Description for this role option')
            .setRequired(false))),
        async execute(interaction, bot) {
            if (!features_1.FeatureManager.isEnabled('roleManagement')) {
                const disabledEmbed = embed_1.EmbedManager.createErrorEmbed('Feature Disabled', 'Role management is currently disabled.');
                await interaction.reply({ embeds: [disabledEmbed], ephemeral: true });
                return;
            }
            if (!permissions_1.PermissionManager.isStaff(interaction.member)) {
                const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only staff members can manage role pickers.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }
            const roleManager = new index_1.RoleManager(bot);
            const subcommand = interaction.options.getSubcommand();
            switch (subcommand) {
                case 'create':
                    await handleRolePickerCreate(interaction, roleManager);
                    break;
                case 'add-role':
                    await handleRolePickerAddRole(interaction, roleManager);
                    break;
            }
        }
    }
];
async function handleRoleAdd(interaction, roleManager) {
    try {
        const user = interaction.options.getUser('user', true);
        const role = interaction.options.getRole('role', true);
        const member = await interaction.guild?.members.fetch(user.id);
        if (!member) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('User Not Found', 'The specified user is not in this server.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        const success = await roleManager.addRole(member, role.id, interaction.user.id);
        if (success) {
            const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Role Added', `Successfully added role ${role.name} to ${user.tag}.`);
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        }
        else {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Role Add Failed', 'Failed to add the role. Check permissions and try again.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
    catch (error) {
        console.error('Error adding role:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while adding the role.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
async function handleRoleRemove(interaction, roleManager) {
    try {
        const user = interaction.options.getUser('user', true);
        const role = interaction.options.getRole('role', true);
        const member = await interaction.guild?.members.fetch(user.id);
        if (!member) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('User Not Found', 'The specified user is not in this server.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        const success = await roleManager.removeRole(member, role.id, interaction.user.id);
        if (success) {
            const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Role Removed', `Successfully removed role ${role.name} from ${user.tag}.`);
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        }
        else {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Role Remove Failed', 'Failed to remove the role. Check permissions and try again.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
    catch (error) {
        console.error('Error removing role:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while removing the role.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
async function handleRoleMassAdd(interaction, roleManager) {
    try {
        const targetRole = interaction.options.getRole('target-role', true);
        const filterRole = interaction.options.getRole('filter-role', true);
        await interaction.deferReply({ ephemeral: true });
        const result = await roleManager.massAddRole(targetRole.id, filterRole.id, interaction.user.id);
        const resultEmbed = embed_1.EmbedManager.createInfoEmbed('Mass Role Addition Complete', `Mass role addition completed.`);
        resultEmbed.addFields({ name: 'Target Role', value: targetRole.name, inline: true }, { name: 'Filter Role', value: filterRole.name, inline: true }, { name: 'Total Users', value: result.total.toString(), inline: true }, { name: 'Successful', value: result.successful.toString(), inline: true }, { name: 'Failed', value: result.failed.toString(), inline: true });
        await interaction.editReply({ embeds: [resultEmbed] });
    }
    catch (error) {
        console.error('Error in mass role add:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred during mass role addition.');
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}
async function handleRoleMassRemove(interaction, roleManager) {
    try {
        const targetRole = interaction.options.getRole('target-role', true);
        const filterRole = interaction.options.getRole('filter-role', true);
        await interaction.deferReply({ ephemeral: true });
        const result = await roleManager.massRemoveRole(targetRole.id, filterRole.id, interaction.user.id);
        const resultEmbed = embed_1.EmbedManager.createInfoEmbed('Mass Role Removal Complete', `Mass role removal completed.`);
        resultEmbed.addFields({ name: 'Target Role', value: targetRole.name, inline: true }, { name: 'Filter Role', value: filterRole.name, inline: true }, { name: 'Total Users', value: result.total.toString(), inline: true }, { name: 'Successful', value: result.successful.toString(), inline: true }, { name: 'Failed', value: result.failed.toString(), inline: true });
        await interaction.editReply({ embeds: [resultEmbed] });
    }
    catch (error) {
        console.error('Error in mass role remove:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred during mass role removal.');
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}
async function handleRoleInfo(interaction, roleManager) {
    try {
        const role = interaction.options.getRole('role', true);
        const infoEmbed = embed_1.EmbedManager.createInfoEmbed(`Role Information: ${role.name}`, `Details about the ${role.name} role.`);
        infoEmbed.addFields({ name: 'Role ID', value: role.id, inline: true }, { name: 'Color', value: 'hexColor' in role ? role.hexColor : 'N/A', inline: true }, { name: 'Position', value: 'position' in role ? role.position.toString() : 'N/A', inline: true }, { name: 'Mentionable', value: 'mentionable' in role ? (role.mentionable ? 'Yes' : 'No') : 'N/A', inline: true }, { name: 'Hoisted', value: 'hoist' in role ? (role.hoist ? 'Yes' : 'No') : 'N/A', inline: true }, { name: 'Members', value: 'members' in role ? role.members.size.toString() : 'N/A', inline: true }, { name: 'Created', value: 'createdTimestamp' in role ? `<t:${Math.floor(role.createdTimestamp / 1000)}:R>` : 'N/A', inline: true });
        if ('permissions' in role && typeof role.permissions !== 'string' && typeof role.permissions.toArray === 'function') {
            const permissions = role.permissions.toArray().slice(0, 10).join(', ');
            infoEmbed.addFields({
                name: 'Key Permissions',
                value: permissions,
                inline: false
            });
        }
        await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
    }
    catch (error) {
        console.error('Error getting role info:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while retrieving role information.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
async function handleRolePickerCreate(interaction, roleManager) {
    try {
        const title = interaction.options.getString('title', true);
        const description = interaction.options.getString('description') || 'React with an emoji to get a role!';
        const success = await roleManager.createRolePicker(title, description, interaction.channelId, interaction.user.id);
        if (success) {
            const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Role Picker Created', 'Role picker message has been created. Use `/rolepicker add-role` to add roles to it.');
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        }
        else {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Creation Failed', 'Failed to create the role picker. Please try again.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
    catch (error) {
        console.error('Error creating role picker:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while creating the role picker.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
async function handleRolePickerAddRole(interaction, roleManager) {
    try {
        const messageId = interaction.options.getString('message-id', true);
        const role = interaction.options.getRole('role', true);
        const emoji = interaction.options.getString('emoji', true);
        const description = interaction.options.getString('description') || role.name;
        const success = await roleManager.addRoleToRolePicker(messageId, role.id, emoji, description);
        if (success) {
            const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Role Added to Picker', `Successfully added ${role.name} to the role picker with emoji ${emoji}.`);
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        }
        else {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Addition Failed', 'Failed to add the role to the picker. Check the message ID and try again.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
    catch (error) {
        console.error('Error adding role to picker:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while adding the role to the picker.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
//# sourceMappingURL=role.js.map