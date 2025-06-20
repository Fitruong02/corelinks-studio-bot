// ===== src/commands/ticket.ts =====
import { SlashCommandBuilder, ChatInputCommandInteraction, StringSelectMenuBuilder, ActionRowBuilder, ComponentType } from 'discord.js';
import { CorelinksBot } from '../bot';
import { TicketManager } from '@modules/ticket/index';
import { ServiceType, TicketPriority } from '../types/ticket';
import { EmbedManager } from '@utils/embed';
import { PermissionManager } from '@utils/permissions';
import { FeatureManager } from '../config/features';

export const ticketCommands = [
  {
    data: new SlashCommandBuilder()
      .setName('ticket')
      .setDescription('Ticket management commands')
      .addSubcommand(subcommand =>
        subcommand
          .setName('create')
          .setDescription('Create a new support ticket')
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName('close')
          .setDescription('Close a ticket')
          .addStringOption(option =>
            option
              .setName('ticket-id')
              .setDescription('Ticket ID to close')
              .setRequired(true)
          )
          .addStringOption(option =>
            option
              .setName('reason')
              .setDescription('Reason for closing')
              .setRequired(false)
          )
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName('assign')
          .setDescription('Assign a ticket to a staff member')
          .addStringOption(option =>
            option
              .setName('ticket-id')
              .setDescription('Ticket ID to assign')
              .setRequired(true)
          )
          .addUserOption(option =>
            option
              .setName('staff')
              .setDescription('Staff member to assign')
              .setRequired(true)
          )
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName('priority')
          .setDescription('Set ticket priority')
          .addStringOption(option =>
            option
              .setName('ticket-id')
              .setDescription('Ticket ID')
              .setRequired(true)
          )
          .addStringOption(option =>
            option
              .setName('level')
              .setDescription('Priority level')
              .setRequired(true)
              .addChoices(
                { name: 'Low', value: 'low' },
                { name: 'Medium', value: 'medium' },
                { name: 'High', value: 'high' }
              )
          )
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName('status')
          .setDescription('Check your ticket status')
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName('history')
          .setDescription('View ticket history (Staff only)')
          .addUserOption(option =>
            option
              .setName('user')
              .setDescription('User to check history for')
              .setRequired(false)
          )
      ),

    async execute(interaction: ChatInputCommandInteraction, bot: CorelinksBot) {
      if (!FeatureManager.isEnabled('ticketSystem')) {
        const disabledEmbed = EmbedManager.createErrorEmbed(
          'Feature Disabled',
          'The ticket system is currently disabled.'
        );
        await interaction.reply({ embeds: [disabledEmbed], ephemeral: true });
        return;
      }

      const ticketManager = new TicketManager(bot);
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

async function handleTicketCreate(interaction: ChatInputCommandInteraction, ticketManager: TicketManager): Promise<void> {
  try {
    const createEmbed = EmbedManager.createInfoEmbed(
      'Create Support Ticket',
      'Please select the service you need help with:'
    );

    const serviceSelect = new StringSelectMenuBuilder()
      .setCustomId('service_selection')
      .setPlaceholder('Choose a service...')
      .addOptions([
        {
          label: 'Game Services',
          value: ServiceType.GAME,
          description: 'Game server setup, configuration, and support',
          emoji: '🎮'
        },
        {
          label: 'Discord Services',
          value: ServiceType.DISCORD,
          description: 'Discord bot setup, moderation, and customization',
          emoji: '💬'
        },
        {
          label: 'Minecraft Services',
          value: ServiceType.MINECRAFT,
          description: 'Minecraft server hosting, plugins, and management',
          emoji: '⛏️'
        }
      ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(serviceSelect);

    await interaction.reply({
      embeds: [createEmbed],
      components: [row],
      ephemeral: true
    });

  } catch (error) {
    console.error('Error creating ticket:', error);
    const errorEmbed = EmbedManager.createErrorEmbed(
      'Error',
      'Failed to create ticket selection menu.'
    );
    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
}

async function handleTicketClose(interaction: ChatInputCommandInteraction, ticketManager: TicketManager): Promise<void> {
  try {
    if (!PermissionManager.isStaff(interaction.member as any)) {
      const errorEmbed = EmbedManager.createErrorEmbed(
        'Permission Denied',
        'Only staff members can close tickets.'
      );
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      return;
    }

    const ticketId = interaction.options.getString('ticket-id', true);
    const reason = interaction.options.getString('reason') || 'Closed by staff';

    const success = await ticketManager.closeTicket(ticketId, interaction.user.id, reason);

    if (success) {
      const successEmbed = EmbedManager.createSuccessEmbed(
        'Ticket Closed',
        `Ticket ${ticketId} has been closed successfully.`
      );
      await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    } else {
      const errorEmbed = EmbedManager.createErrorEmbed(
        'Close Failed',
        'Failed to close the ticket. Please check the ticket ID.'
      );
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

  } catch (error) {
    console.error('Error closing ticket:', error);
    const errorEmbed = EmbedManager.createErrorEmbed(
      'Error',
      'An error occurred while closing the ticket.'
    );
    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
}

async function handleTicketAssign(interaction: ChatInputCommandInteraction, ticketManager: TicketManager): Promise<void> {
  try {
    if (!PermissionManager.isStaff(interaction.member as any)) {
      const errorEmbed = EmbedManager.createErrorEmbed(
        'Permission Denied',
        'Only staff members can assign tickets.'
      );
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      return;
    }

    const ticketId = interaction.options.getString('ticket-id', true);
    const staff = interaction.options.getUser('staff', true);

    const success = await ticketManager.assignTicket(ticketId, staff.id, interaction.user.id);

    if (success) {
      const successEmbed = EmbedManager.createSuccessEmbed(
        'Ticket Assigned',
        `Ticket ${ticketId} has been assigned to ${staff.tag}.`
      );
      await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    } else {
      const errorEmbed = EmbedManager.createErrorEmbed(
        'Assignment Failed',
        'Failed to assign the ticket. Please check the ticket ID.'
      );
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

  } catch (error) {
    console.error('Error assigning ticket:', error);
    const errorEmbed = EmbedManager.createErrorEmbed(
      'Error',
      'An error occurred while assigning the ticket.'
    );
    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
}

async function handleTicketPriority(interaction: ChatInputCommandInteraction, ticketManager: TicketManager): Promise<void> {
  try {
    if (!PermissionManager.isStaff(interaction.member as any)) {
      const errorEmbed = EmbedManager.createErrorEmbed(
        'Permission Denied',
        'Only staff members can set ticket priority.'
      );
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      return;
    }

    const ticketId = interaction.options.getString('ticket-id', true);
    const priority = interaction.options.getString('level', true) as TicketPriority;

    const success = await ticketManager.setTicketPriority(ticketId, priority, interaction.user.id);

    if (success) {
      const successEmbed = EmbedManager.createSuccessEmbed(
        'Priority Updated',
        `Ticket ${ticketId} priority set to ${priority.toUpperCase()}.`
      );
      await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    } else {
      const errorEmbed = EmbedManager.createErrorEmbed(
        'Update Failed',
        'Failed to update ticket priority. Please check the ticket ID.'
      );
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

  } catch (error) {
    console.error('Error setting ticket priority:', error);
    const errorEmbed = EmbedManager.createErrorEmbed(
      'Error',
      'An error occurred while setting ticket priority.'
    );
    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
}

async function handleTicketStatus(interaction: ChatInputCommandInteraction, ticketManager: TicketManager): Promise<void> {
  try {
    const ticket = await ticketManager.getTicketStatus(interaction.user.id);

    if (!ticket) {
      const noTicketEmbed = EmbedManager.createInfoEmbed(
        'No Active Ticket',
        'You do not have any active tickets.'
      );
      await interaction.reply({ embeds: [noTicketEmbed], ephemeral: true });
      return;
    }

    const statusEmbed = EmbedManager.createInfoEmbed(
      'Your Ticket Status',
      `Here is the status of your current ticket:`
    );

    statusEmbed.addFields(
      { name: 'Ticket ID', value: ticket.ticketId, inline: true },
      { name: 'Customer ID', value: ticket.customerId, inline: true },
      { name: 'Service', value: ticket.service, inline: true },
      { name: 'Status', value: ticket.status.toUpperCase(), inline: true },
      { name: 'Priority', value: ticket.priority.toUpperCase(), inline: true },
      { name: 'Created', value: `<t:${Math.floor(ticket.createdAt.getTime() / 1000)}:R>`, inline: true }
    );

    if (ticket.assignedStaff) {
      statusEmbed.addFields({
        name: 'Assigned Staff',
        value: `<@${ticket.assignedStaff}>`,
        inline: true
      });
    }

    await interaction.reply({ embeds: [statusEmbed], ephemeral: true });

  } catch (error) {
    console.error('Error getting ticket status:', error);
    const errorEmbed = EmbedManager.createErrorEmbed(
      'Error',
      'An error occurred while retrieving ticket status.'
    );
    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
}

async function handleTicketHistory(interaction: ChatInputCommandInteraction, ticketManager: TicketManager): Promise<void> {
  try {
    if (!PermissionManager.isStaff(interaction.member as any)) {
      const errorEmbed = EmbedManager.createErrorEmbed(
        'Permission Denied',
        'Only staff members can view ticket history.'
      );
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      return;
    }

    const user = interaction.options.getUser('user') || interaction.user;
    const activeTickets = ticketManager.getAllActiveTickets()
      .filter(ticket => ticket.userId === user.id);

    if (activeTickets.length === 0) {
      const noHistoryEmbed = EmbedManager.createInfoEmbed(
        'No Ticket History',
        `${user.tag} has no active tickets.`
      );
      await interaction.reply({ embeds: [noHistoryEmbed], ephemeral: true });
      return;
    }

    const historyEmbed = EmbedManager.createInfoEmbed(
      'Ticket History',
      `Active tickets for ${user.tag}:`
    );

    for (const ticket of activeTickets.slice(0, 5)) { // Limit to 5 tickets
      historyEmbed.addFields({
        name: `${ticket.ticketId} (${ticket.service})`,
        value: `Status: ${ticket.status}\nPriority: ${ticket.priority}\nCreated: <t:${Math.floor(ticket.createdAt.getTime() / 1000)}:R>`,
        inline: true
      });
    }

    await interaction.reply({ embeds: [historyEmbed], ephemeral: true });

  } catch (error) {
    console.error('Error getting ticket history:', error);
    const errorEmbed = EmbedManager.createErrorEmbed(
      'Error',
      'An error occurred while retrieving ticket history.'
    );
    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
}