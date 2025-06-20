// ===== src/events/interactionCreate.ts =====
import { Interaction, Events } from 'discord.js';
import { CorelinksBot } from '../bot';
import { Logger } from '@utils/logger';
import { EmbedManager } from '@utils/embed';
import { HelperUtils } from '@utils/helpers';

const logger = new Logger('InteractionCreateEvent');

export function interactionCreateEvent(bot: CorelinksBot) {
  bot.client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        await handleSlashCommand(interaction, bot);
      } else if (interaction.isButton()) {
        await handleButtonInteraction(interaction, bot);
      } else if (interaction.isStringSelectMenu()) {
        await handleSelectMenuInteraction(interaction, bot);
      }
    } catch (error) {
      logger.error('Error in interactionCreate event:', error);
    }
  })
}

async function handleSlashCommand(interaction: any, bot: CorelinksBot) {
  const command = bot.commands.get(interaction.commandName);

  if (!command) {
    logger.warn(`Unknown command: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction, bot);

    // Log command usage
    if (bot.channelManager) {
      const logEmbed = EmbedManager.createLogEmbed(
        'Command Used',
        `${HelperUtils.formatUserTag(interaction.user)} used command: \`/${interaction.commandName}\``,
        [
          { name: 'Channel', value: interaction.channel?.name || 'DM', inline: true },
          { name: 'Timestamp', value: HelperUtils.formatTimestamp(new Date()), inline: true }
        ]
      );

      await bot.channelManager.sendLog('cmdLogs', logEmbed);
    }

  } catch (error) {
    logger.error(`Error executing command ${interaction.commandName}:`, error);

    const errorEmbed = EmbedManager.createErrorEmbed(
      'Command Error',
      'An error occurred while executing this command. Please try again later.'
    );

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
}

async function handleButtonInteraction(interaction: any, bot: CorelinksBot) {
  const [action, ...params] = interaction.customId.split('_');

  try {
    switch (action) {
      case 'ticket':
        const { TicketManager } = await import('@modules/ticket/index');
        const ticketManager = new TicketManager(bot);
        await ticketManager.handleButtonInteraction(interaction, params);
        break;

      case 'payment':
        const { PaymentManager } = await import('@modules/payment/index');
        const paymentManager = new PaymentManager(bot);
        await paymentManager.handleButtonInteraction(interaction, params);
        break;

      case 'voice':
        const { VoiceManager } = await import('@modules/voice/index');
        const voiceManager = new VoiceManager(bot);
        await voiceManager.handleButtonInteraction(interaction, params);
        break;

      default:
        logger.warn(`Unknown button action: ${action}`);
    }
  } catch (error) {
    logger.error(`Error handling button interaction ${action}:`, error);

    const errorEmbed = EmbedManager.createErrorEmbed(
      'Interaction Error',
      'An error occurred while processing your request.'
    );

    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
}

async function handleSelectMenuInteraction(interaction: any, bot: CorelinksBot) {
  const [action, ...params] = interaction.customId.split('_');

  try {
    switch (action) {
      case 'service':
        const { TicketManager } = await import('@modules/ticket/index');
        const ticketManager = new TicketManager(bot);
        await ticketManager.handleServiceSelection(interaction, params);
        break;

      case 'role':
        const { RoleManager } = await import('@modules/role/index');
        const roleManager = new RoleManager(bot);
        await roleManager.handleRoleSelection(interaction, params);
        break;

      default:
        logger.warn(`Unknown select menu action: ${action}`);
    }
  } catch (error) {
    logger.error(`Error handling select menu interaction ${action}:`, error);

    const errorEmbed = EmbedManager.createErrorEmbed(
      'Interaction Error',
      'An error occurred while processing your selection.'
    );

    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
}