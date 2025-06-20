"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketCommands = void 0;
const discord_js_1 = require("discord.js");
const index_1 = require("@modules/ticket/index");
const ticket_1 = require("../types/ticket");
const embed_1 = require("@utils/embed");
const permissions_1 = require("@utils/permissions");
const features_1 = require("../config/features");
exports.ticketCommands = [
    {
        data: new discord_js_1.SlashCommandBuilder()
            .setName('ticket')
            .setDescription('Ticket management commands')
            .addSubcommand(subcommand => subcommand
            .setName('create')
            .setDescription('Create a new support ticket'))
            .addSubcommand(subcommand => subcommand
            .setName('close')
            .setDescription('Close a ticket')
            .addStringOption(option => option
            .setName('ticket-id')
            .setDescription('Ticket ID to close')
            .setRequired(true))
            .addStringOption(option => option
            .setName('reason')
            .setDescription('Reason for closing')
            .setRequired(false)))
            .addSubcommand(subcommand => subcommand
            .setName('assign')
            .setDescription('Assign a ticket to a staff member')
            .addStringOption(option => option
            .setName('ticket-id')
            .setDescription('Ticket ID to assign')
            .setRequired(true))
            .addUserOption(option => option
            .setName('staff')
            .setDescription('Staff member to assign')
            .setRequired(true)))
            .addSubcommand(subcommand => subcommand
            .setName('priority')
            .setDescription('Set ticket priority')
            .addStringOption(option => option
            .setName('ticket-id')
            .setDescription('Ticket ID')
            .setRequired(true))
            .addStringOption(option => option
            .setName('level')
            .setDescription('Priority level')
            .setRequired(true)
            .addChoices({ name: 'Low', value: 'low' }, { name: 'Medium', value: 'medium' }, { name: 'High', value: 'high' })))
            .addSubcommand(subcommand => subcommand
            .setName('status')
            .setDescription('Check your ticket status'))
            .addSubcommand(subcommand => subcommand
            .setName('history')
            .setDescription('View ticket history (Staff only)')
            .addUserOption(option => option
            .setName('user')
            .setDescription('User to check history for')
            .setRequired(false))),
        async execute(interaction, bot) {
            if (!features_1.FeatureManager.isEnabled('ticketSystem')) {
                const disabledEmbed = embed_1.EmbedManager.createErrorEmbed('Feature Disabled', 'The ticket system is currently disabled.');
                await interaction.reply({ embeds: [disabledEmbed], ephemeral: true });
                return;
            }
            const ticketManager = new index_1.TicketManager(bot);
            const subcommand = interaction.options.getSubcommand();
            switch (subcommand) {
                case 'create':
                    await handleTicketCreate(interaction, ticketManager);
                    break;
                case 'close':
                    await handleTicketClose(interaction, ticketManager);
                    break;
                case 'assign':
                    await handleTicketAssign(interaction, ticketManager);
                    break;
                case 'priority':
                    await handleTicketPriority(interaction, ticketManager);
                    break;
                case 'status':
                    await handleTicketStatus(interaction, ticketManager);
                    break;
                case 'history':
                    await handleTicketHistory(interaction, ticketManager);
                    break;
            }
        }
    }
];
async function handleTicketCreate(interaction, ticketManager) {
    try {
        const createEmbed = embed_1.EmbedManager.createInfoEmbed('Create Support Ticket', 'Please select the service you need help with:');
        const serviceSelect = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('service_selection')
            .setPlaceholder('Choose a service...')
            .addOptions([
            {
                label: 'Game Services',
                value: ticket_1.ServiceType.GAME,
                description: 'Game server setup, configuration, and support',
                emoji: '🎮'
            },
            {
                label: 'Discord Services',
                value: ticket_1.ServiceType.DISCORD,
                description: 'Discord bot setup, moderation, and customization',
                emoji: '💬'
            },
            {
                label: 'Minecraft Services',
                value: ticket_1.ServiceType.MINECRAFT,
                description: 'Minecraft server hosting, plugins, and management',
                emoji: '⛏️'
            }
        ]);
        const row = new discord_js_1.ActionRowBuilder().addComponents(serviceSelect);
        await interaction.reply({
            embeds: [createEmbed],
            components: [row],
            ephemeral: true
        });
    }
    catch (error) {
        console.error('Error creating ticket:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'Failed to create ticket selection menu.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
async function handleTicketClose(interaction, ticketManager) {
    try {
        if (!permissions_1.PermissionManager.isStaff(interaction.member)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only staff members can close tickets.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        const ticketId = interaction.options.getString('ticket-id', true);
        const reason = interaction.options.getString('reason') || 'Closed by staff';
        const success = await ticketManager.closeTicket(ticketId, interaction.user.id, reason);
        if (success) {
            const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Ticket Closed', `Ticket ${ticketId} has been closed successfully.`);
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        }
        else {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Close Failed', 'Failed to close the ticket. Please check the ticket ID.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
    catch (error) {
        console.error('Error closing ticket:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while closing the ticket.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
async function handleTicketAssign(interaction, ticketManager) {
    try {
        if (!permissions_1.PermissionManager.isStaff(interaction.member)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only staff members can assign tickets.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        const ticketId = interaction.options.getString('ticket-id', true);
        const staff = interaction.options.getUser('staff', true);
        const success = await ticketManager.assignTicket(ticketId, staff.id, interaction.user.id);
        if (success) {
            const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Ticket Assigned', `Ticket ${ticketId} has been assigned to ${staff.tag}.`);
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        }
        else {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Assignment Failed', 'Failed to assign the ticket. Please check the ticket ID.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
    catch (error) {
        console.error('Error assigning ticket:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while assigning the ticket.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
async function handleTicketPriority(interaction, ticketManager) {
    try {
        if (!permissions_1.PermissionManager.isStaff(interaction.member)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only staff members can set ticket priority.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        const ticketId = interaction.options.getString('ticket-id', true);
        const priority = interaction.options.getString('level', true);
        const success = await ticketManager.setTicketPriority(ticketId, priority, interaction.user.id);
        if (success) {
            const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Priority Updated', `Ticket ${ticketId} priority set to ${priority.toUpperCase()}.`);
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        }
        else {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Update Failed', 'Failed to update ticket priority. Please check the ticket ID.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
    catch (error) {
        console.error('Error setting ticket priority:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while setting ticket priority.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
async function handleTicketStatus(interaction, ticketManager) {
    try {
        const ticket = await ticketManager.getTicketStatus(interaction.user.id);
        if (!ticket) {
            const noTicketEmbed = embed_1.EmbedManager.createInfoEmbed('No Active Ticket', 'You do not have any active tickets.');
            await interaction.reply({ embeds: [noTicketEmbed], ephemeral: true });
            return;
        }
        const statusEmbed = embed_1.EmbedManager.createInfoEmbed('Your Ticket Status', `Here is the status of your current ticket:`);
        statusEmbed.addFields({ name: 'Ticket ID', value: ticket.ticketId, inline: true }, { name: 'Customer ID', value: ticket.customerId, inline: true }, { name: 'Service', value: ticket.service, inline: true }, { name: 'Status', value: ticket.status.toUpperCase(), inline: true }, { name: 'Priority', value: ticket.priority.toUpperCase(), inline: true }, { name: 'Created', value: `<t:${Math.floor(ticket.createdAt.getTime() / 1000)}:R>`, inline: true });
        if (ticket.assignedStaff) {
            statusEmbed.addFields({
                name: 'Assigned Staff',
                value: `<@${ticket.assignedStaff}>`,
                inline: true
            });
        }
        await interaction.reply({ embeds: [statusEmbed], ephemeral: true });
    }
    catch (error) {
        console.error('Error getting ticket status:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while retrieving ticket status.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
async function handleTicketHistory(interaction, ticketManager) {
    try {
        if (!permissions_1.PermissionManager.isStaff(interaction.member)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only staff members can view ticket history.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        const user = interaction.options.getUser('user') || interaction.user;
        const activeTickets = ticketManager.getAllActiveTickets()
            .filter(ticket => ticket.userId === user.id);
        if (activeTickets.length === 0) {
            const noHistoryEmbed = embed_1.EmbedManager.createInfoEmbed('No Ticket History', `${user.tag} has no active tickets.`);
            await interaction.reply({ embeds: [noHistoryEmbed], ephemeral: true });
            return;
        }
        const historyEmbed = embed_1.EmbedManager.createInfoEmbed('Ticket History', `Active tickets for ${user.tag}:`);
        for (const ticket of activeTickets.slice(0, 5)) {
            historyEmbed.addFields({
                name: `${ticket.ticketId} (${ticket.service})`,
                value: `Status: ${ticket.status}\nPriority: ${ticket.priority}\nCreated: <t:${Math.floor(ticket.createdAt.getTime() / 1000)}:R>`,
                inline: true
            });
        }
        await interaction.reply({ embeds: [historyEmbed], ephemeral: true });
    }
    catch (error) {
        console.error('Error getting ticket history:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while retrieving ticket history.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
//# sourceMappingURL=ticket.js.map