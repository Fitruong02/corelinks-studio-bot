"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.interactionCreateEvent = interactionCreateEvent;
const discord_js_1 = require("discord.js");
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
const helpers_1 = require("@utils/helpers");
const logger = new logger_1.Logger('InteractionCreateEvent');
function interactionCreateEvent(bot) {
    bot.client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
        try {
            if (interaction.isChatInputCommand()) {
                await handleSlashCommand(interaction, bot);
            }
            else if (interaction.isButton()) {
                await handleButtonInteraction(interaction, bot);
            }
            else if (interaction.isStringSelectMenu()) {
                await handleSelectMenuInteraction(interaction, bot);
            }
        }
        catch (error) {
            logger.error('Error in interactionCreate event:', error);
        }
    });
}
async function handleSlashCommand(interaction, bot) {
    const command = bot.commands.get(interaction.commandName);
    if (!command) {
        logger.warn(`Unknown command: ${interaction.commandName}`);
        return;
    }
    try {
        await command.execute(interaction, bot);
        if (bot.channelManager) {
            const logEmbed = embed_1.EmbedManager.createLogEmbed('Command Used', `${helpers_1.HelperUtils.formatUserTag(interaction.user)} used command: \`/${interaction.commandName}\``, [
                { name: 'Channel', value: interaction.channel?.name || 'DM', inline: true },
                { name: 'Timestamp', value: helpers_1.HelperUtils.formatTimestamp(new Date()), inline: true }
            ]);
            await bot.channelManager.sendLog('cmdLogs', logEmbed);
        }
    }
    catch (error) {
        logger.error(`Error executing command ${interaction.commandName}:`, error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Command Error', 'An error occurred while executing this command. Please try again later.');
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        }
        else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}
async function handleButtonInteraction(interaction, bot) {
    const [action, ...params] = interaction.customId.split('_');
    try {
        switch (action) {
            case 'ticket':
                const { TicketManager } = await Promise.resolve().then(() => __importStar(require('@modules/ticket/index')));
                const ticketManager = new TicketManager(bot);
                await ticketManager.handleButtonInteraction(interaction, params);
                break;
            case 'payment':
                const { PaymentManager } = await Promise.resolve().then(() => __importStar(require('@modules/payment/index')));
                const paymentManager = new PaymentManager(bot);
                await paymentManager.handleButtonInteraction(interaction, params);
                break;
            case 'voice':
                const { VoiceManager } = await Promise.resolve().then(() => __importStar(require('@modules/voice/index')));
                const voiceManager = new VoiceManager(bot);
                await voiceManager.handleButtonInteraction(interaction, params);
                break;
            default:
                logger.warn(`Unknown button action: ${action}`);
        }
    }
    catch (error) {
        logger.error(`Error handling button interaction ${action}:`, error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Interaction Error', 'An error occurred while processing your request.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
async function handleSelectMenuInteraction(interaction, bot) {
    const [action, ...params] = interaction.customId.split('_');
    try {
        switch (action) {
            case 'service':
                const { TicketManager } = await Promise.resolve().then(() => __importStar(require('@modules/ticket/index')));
                const ticketManager = new TicketManager(bot);
                await ticketManager.handleServiceSelection(interaction, params);
                break;
            case 'role':
                const { RoleManager } = await Promise.resolve().then(() => __importStar(require('@modules/role/index')));
                const roleManager = new RoleManager(bot);
                await roleManager.handleRoleSelection(interaction, params);
                break;
            default:
                logger.warn(`Unknown select menu action: ${action}`);
        }
    }
    catch (error) {
        logger.error(`Error handling select menu interaction ${action}:`, error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Interaction Error', 'An error occurred while processing your selection.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
//# sourceMappingURL=interactionCreate.js.map