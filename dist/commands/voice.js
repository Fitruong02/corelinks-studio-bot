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
exports.voiceCommands = void 0;
const discord_js_1 = require("discord.js");
const index_1 = require("@modules/voice/index");
const embed_1 = require("@utils/embed");
const features_1 = require("@config/features");
exports.voiceCommands = [
    {
        data: new discord_js_1.SlashCommandBuilder()
            .setName('voice')
            .setDescription('Voice channel management commands')
            .addSubcommand(subcommand => subcommand
            .setName('create')
            .setDescription('Create a temporary voice channel')
            .addStringOption(option => option
            .setName('name')
            .setDescription('Name for the voice channel')
            .setRequired(false)))
            .addSubcommand(subcommand => subcommand
            .setName('rename')
            .setDescription('Rename your voice channel')
            .addStringOption(option => option
            .setName('name')
            .setDescription('New name for the channel')
            .setRequired(true)))
            .addSubcommand(subcommand => subcommand
            .setName('lock')
            .setDescription('Lock your voice channel'))
            .addSubcommand(subcommand => subcommand
            .setName('unlock')
            .setDescription('Unlock your voice channel'))
            .addSubcommand(subcommand => subcommand
            .setName('limit')
            .setDescription('Set user limit for your voice channel')
            .addIntegerOption(option => option
            .setName('amount')
            .setDescription('User limit (0 for no limit)')
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(99)))
            .addSubcommand(subcommand => subcommand
            .setName('invite')
            .setDescription('Invite a user to your voice channel')
            .addUserOption(option => option
            .setName('user')
            .setDescription('User to invite')
            .setRequired(true)))
            .addSubcommand(subcommand => subcommand
            .setName('transfer')
            .setDescription('Transfer ownership of your voice channel')
            .addUserOption(option => option
            .setName('user')
            .setDescription('New owner of the channel')
            .setRequired(true)))
            .addSubcommand(subcommand => subcommand
            .setName('delete')
            .setDescription('Delete your voice channel')),
        async execute(interaction, bot) {
            if (!features_1.FeatureManager.isEnabled('voiceManagement')) {
                const disabledEmbed = embed_1.EmbedManager.createErrorEmbed('Feature Disabled', 'Voice management is currently disabled.');
                await interaction.reply({ embeds: [disabledEmbed], ephemeral: true });
                return;
            }
            const voiceManager = new index_1.VoiceManager(bot);
            const subcommand = interaction.options.getSubcommand();
            switch (subcommand) {
                case 'create':
                    await handleVoiceCreate(interaction, voiceManager);
                    break;
                case 'rename':
                    await handleVoiceRename(interaction, voiceManager);
                    break;
                case 'lock':
                    await handleVoiceLock(interaction, voiceManager);
                    break;
                case 'unlock':
                    await handleVoiceUnlock(interaction, voiceManager);
                    break;
                case 'limit':
                    await handleVoiceLimit(interaction, voiceManager);
                    break;
                case 'invite':
                    await handleVoiceInvite(interaction, voiceManager);
                    break;
                case 'transfer':
                    await handleVoiceTransfer(interaction, voiceManager);
                    break;
                case 'delete':
                    await handleVoiceDelete(interaction, voiceManager);
                    break;
            }
        }
    }
];
async function handleVoiceCreate(interaction, voiceManager) {
    try {
        const member = interaction.member;
        const channelName = interaction.options.getString('name');
        if (!member) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'Could not find member information.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        const tempChannel = await voiceManager.createTempChannel(member, channelName || undefined);
        if (tempChannel) {
            const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Channel Created', `Your temporary voice channel "${tempChannel.name}" has been created.`);
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        }
        else {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Creation Failed', 'Failed to create the voice channel. Please try again.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
    catch (error) {
        console.error('Error creating voice channel:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while creating the voice channel.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
async function handleVoiceRename(interaction, voiceManager) {
    try {
        const member = interaction.member;
        const newName = interaction.options.getString('name', true);
        if (!member) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'Could not find member information.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        const voiceChannel = member.voice?.channel;
        if (!voiceChannel || !voiceManager.isTempChannel(voiceChannel.id)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Not in Temp Channel', 'You must be in a temporary voice channel to use this command.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        if (!voiceManager.canControlChannel(voiceChannel.id, interaction.user.id)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only the channel owner can rename the channel.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        await voiceChannel.setName(newName, `Renamed by ${interaction.user.tag}`);
        const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Channel Renamed', `Channel renamed to "${newName}".`);
        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    }
    catch (error) {
        console.error('Error renaming voice channel:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while renaming the channel.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
async function handleVoiceLock(interaction, voiceManager) {
    try {
        const member = interaction.member;
        if (!member) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'Could not find member information.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        const voiceChannel = member.voice?.channel;
        if (!voiceChannel || !voiceManager.isTempChannel(voiceChannel.id)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Not in Temp Channel', 'You must be in a temporary voice channel to use this command.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        if (!voiceManager.canControlChannel(voiceChannel.id, interaction.user.id)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only the channel owner can lock the channel.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        await voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, {
            Connect: false
        });
        voiceManager.updateTempChannelData(voiceChannel.id, { isLocked: true });
        const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Channel Locked', 'Your voice channel has been locked. Only current members can stay.');
        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    }
    catch (error) {
        console.error('Error locking voice channel:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while locking the channel.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
async function handleVoiceUnlock(interaction, voiceManager) {
    try {
        const member = interaction.member;
        if (!member) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'Could not find member information.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        const voiceChannel = member.voice?.channel;
        if (!voiceChannel || !voiceManager.isTempChannel(voiceChannel.id)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Not in Temp Channel', 'You must be in a temporary voice channel to use this command.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        if (!voiceManager.canControlChannel(voiceChannel.id, interaction.user.id)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only the channel owner can unlock the channel.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        await voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, {
            Connect: true
        });
        voiceManager.updateTempChannelData(voiceChannel.id, { isLocked: false });
        const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Channel Unlocked', 'Your voice channel has been unlocked. Anyone can join now.');
        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    }
    catch (error) {
        console.error('Error unlocking voice channel:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while unlocking the channel.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
async function handleVoiceLimit(interaction, voiceManager) {
    try {
        const member = interaction.member;
        const limit = interaction.options.getInteger('amount', true);
        if (!member) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'Could not find member information.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        const voiceChannel = member.voice?.channel;
        if (!voiceChannel || !voiceManager.isTempChannel(voiceChannel.id)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Not in Temp Channel', 'You must be in a temporary voice channel to use this command.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        if (!voiceManager.canControlChannel(voiceChannel.id, interaction.user.id)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only the channel owner can set the user limit.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        await voiceChannel.setUserLimit(limit, `Limit set by ${interaction.user.tag}`);
        voiceManager.updateTempChannelData(voiceChannel.id, { userLimit: limit });
        const limitText = limit === 0 ? 'No limit' : `${limit} users`;
        const successEmbed = embed_1.EmbedManager.createSuccessEmbed('User Limit Set', `Channel user limit set to: ${limitText}`);
        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    }
    catch (error) {
        console.error('Error setting voice channel limit:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while setting the user limit.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
async function handleVoiceInvite(interaction, voiceManager) {
    try {
        const member = interaction.member;
        const targetUser = interaction.options.getUser('user', true);
        if (!member) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'Could not find member information.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        const voiceChannel = member.voice?.channel;
        if (!voiceChannel || !voiceManager.isTempChannel(voiceChannel.id)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Not in Temp Channel', 'You must be in a temporary voice channel to use this command.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        if (!voiceManager.canControlChannel(voiceChannel.id, interaction.user.id)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only the channel owner can invite users.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        const invite = await voiceChannel.createInvite({
            maxAge: 3600,
            maxUses: 1,
            unique: true
        });
        const inviteEmbed = embed_1.EmbedManager.createInfoEmbed('Voice Channel Invitation', `${interaction.user.tag} has invited you to join their voice channel: ${voiceChannel.name}`);
        inviteEmbed.addFields({
            name: 'Join Link',
            value: `[Click here to join](${invite.url})`,
            inline: false
        });
        try {
            await targetUser.send({ embeds: [inviteEmbed] });
            const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Invitation Sent', `Invitation sent to ${targetUser.tag} via DM.`);
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        }
        catch (error) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Invitation Failed', `Could not send DM to ${targetUser.tag}. They may have DMs disabled.`);
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
    catch (error) {
        console.error('Error inviting to voice channel:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while sending the invitation.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
async function handleVoiceTransfer(interaction, voiceManager) {
    try {
        const member = interaction.member;
        const newOwner = interaction.options.getUser('user', true);
        if (!member) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'Could not find member information.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        const voiceChannel = member.voice?.channel;
        if (!voiceChannel || !voiceManager.isTempChannel(voiceChannel.id)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Not in Temp Channel', 'You must be in a temporary voice channel to use this command.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        if (!voiceManager.canControlChannel(voiceChannel.id, interaction.user.id)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only the channel owner can transfer ownership.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        if (!voiceChannel.members.has(newOwner.id)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('User Not in Channel', 'The new owner must be in the voice channel.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        const { TempChannelManager } = await Promise.resolve().then(() => __importStar(require('@modules/voice/tempChannels')));
        const tempChannelManager = new TempChannelManager(voiceManager.bot, voiceManager);
        const success = await tempChannelManager.transferOwnership(voiceChannel.id, interaction.user.id, newOwner.id);
        if (success) {
            const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Ownership Transferred', `Channel ownership transferred to ${newOwner.tag}.`);
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        }
        else {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Transfer Failed', 'Failed to transfer channel ownership.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
    catch (error) {
        console.error('Error transferring voice channel ownership:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while transferring ownership.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
async function handleVoiceDelete(interaction, voiceManager) {
    try {
        const member = interaction.member;
        if (!member) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'Could not find member information.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        const voiceChannel = member.voice?.channel;
        if (!voiceChannel || !voiceManager.isTempChannel(voiceChannel.id)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Not in Temp Channel', 'You must be in a temporary voice channel to use this command.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        if (!voiceManager.canControlChannel(voiceChannel.id, interaction.user.id)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only the channel owner can delete the channel.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        const success = await voiceManager.deleteTempChannel(voiceChannel.id, 'Deleted by owner');
        if (success) {
            const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Channel Deleted', 'Your temporary voice channel has been deleted.');
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        }
        else {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Delete Failed', 'Failed to delete the voice channel.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
    catch (error) {
        console.error('Error deleting voice channel:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while deleting the channel.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
//# sourceMappingURL=voice.js.map