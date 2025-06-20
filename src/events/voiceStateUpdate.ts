// ===== src/events/voiceStateUpdate.ts =====
import { VoiceState, Events } from 'discord.js';
import { CorelinksBot } from '../bot';
import { Logger } from '@utils/logger';
import { VoiceManager } from '@modules/voice/index';
import { EmbedManager } from '@utils/embed';
import { HelperUtils } from '@utils/helpers';

const logger = new Logger('VoiceStateUpdateEvent');

export const voiceStateUpdateEvent = {
  name: Events.VoiceStateUpdate,
  once: false,
  async execute(oldState: VoiceState, newState: VoiceState, bot: CorelinksBot) {
    try {
      if (!bot.channelManager) return;
      
      const voiceManager = new VoiceManager(bot);
      
      // Handle temp channel creation
      await voiceManager.handleVoiceStateUpdate(oldState, newState);
      
      // Log voice activity
      await logVoiceActivity(oldState, newState, bot);
      
    } catch (error) {
      logger.error('Error in voiceStateUpdate event:', error);
    }
  }
};

async function logVoiceActivity(oldState: VoiceState, newState: VoiceState, bot: CorelinksBot) {
  if (!bot.channelManager || !newState.member) return;
  
  const member = newState.member;
  let logMessage = '';
  
  // User joined a voice channel
  if (!oldState.channel && newState.channel) {
    logMessage = `🔊 ${HelperUtils.formatUserTag(member)} joined voice channel: ${newState.channel.name}`;
  }
  // User left a voice channel
  else if (oldState.channel && !newState.channel) {
    logMessage = `🔇 ${HelperUtils.formatUserTag(member)} left voice channel: ${oldState.channel.name}`;
  }
  // User switched channels
  else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
    logMessage = `🔄 ${HelperUtils.formatUserTag(member)} moved from ${oldState.channel.name} to ${newState.channel.name}`;
  }
  // User muted/unmuted
  else if (oldState.mute !== newState.mute) {
    logMessage = `🎤 ${HelperUtils.formatUserTag(member)} ${newState.mute ? 'muted' : 'unmuted'} in ${newState.channel?.name}`;
  }
  // User deafened/undeafened
  else if (oldState.deaf !== newState.deaf) {
    logMessage = `🔇 ${HelperUtils.formatUserTag(member)} ${newState.deaf ? 'deafened' : 'undeafened'} in ${newState.channel?.name}`;
  }
  
  if (logMessage) {
    const embed = EmbedManager.createLogEmbed('Voice Activity', logMessage);
    await bot.channelManager.sendLog('voiceLogs', embed);
  }
}