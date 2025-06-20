"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceStateUpdateEvent = voiceStateUpdateEvent;
const discord_js_1 = require("discord.js");
const logger_1 = require("@utils/logger");
const index_1 = require("@modules/voice/index");
const embed_1 = require("@utils/embed");
const helpers_1 = require("@utils/helpers");
const logger = new logger_1.Logger('VoiceStateUpdateEvent');
function voiceStateUpdateEvent(bot) {
    bot.client.on(discord_js_1.Events.VoiceStateUpdate, async (oldState, newState) => {
        try {
            if (!bot.channelManager)
                return;
            const voiceManager = new index_1.VoiceManager(bot);
            await voiceManager.handleVoiceStateUpdate(oldState, newState);
            await logVoiceActivity(oldState, newState, bot);
        }
        catch (error) {
            logger.error('Error in voiceStateUpdate event:', error);
        }
    });
}
async function logVoiceActivity(oldState, newState, bot) {
    if (!bot.channelManager || !newState.member)
        return;
    const member = newState.member;
    let logMessage = '';
    if (!oldState.channel && newState.channel) {
        logMessage = `🔊 ${helpers_1.HelperUtils.formatUserTag(member)} joined voice channel: ${newState.channel.name}`;
    }
    else if (oldState.channel && !newState.channel) {
        logMessage = `🔇 ${helpers_1.HelperUtils.formatUserTag(member)} left voice channel: ${oldState.channel.name}`;
    }
    else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
        logMessage = `🔄 ${helpers_1.HelperUtils.formatUserTag(member)} moved from ${oldState.channel.name} to ${newState.channel.name}`;
    }
    else if (oldState.mute !== newState.mute) {
        logMessage = `🎤 ${helpers_1.HelperUtils.formatUserTag(member)} ${newState.mute ? 'muted' : 'unmuted'} in ${newState.channel?.name}`;
    }
    else if (oldState.deaf !== newState.deaf) {
        logMessage = `🔇 ${helpers_1.HelperUtils.formatUserTag(member)} ${newState.deaf ? 'deafened' : 'undeafened'} in ${newState.channel?.name}`;
    }
    if (logMessage) {
        const embed = embed_1.EmbedManager.createLogEmbed('Voice Activity', logMessage);
        await bot.channelManager.sendLog('voiceLogs', embed);
    }
}
//# sourceMappingURL=voiceStateUpdate.js.map