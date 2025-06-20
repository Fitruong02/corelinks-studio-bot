"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guildMemberAddEvent = guildMemberAddEvent;
const discord_js_1 = require("discord.js");
const logger_1 = require("@utils/logger");
const embed_1 = require("@utils/embed");
const helpers_1 = require("@utils/helpers");
const logger = new logger_1.Logger('GuildMemberAddEvent');
function guildMemberAddEvent(bot) {
    bot.client.on(discord_js_1.Events.GuildMemberAdd, async (member) => {
        try {
            if (!bot.channelManager)
                return;
            const joinEmbed = embed_1.EmbedManager.createLogEmbed('📥 Member Joined', `${helpers_1.HelperUtils.formatUserTag(member)} joined the server`, [
                { name: 'Account Created', value: helpers_1.HelperUtils.formatTimestamp(member.user.createdAt), inline: true },
                { name: 'Member Count', value: member.guild.memberCount.toString(), inline: true }
            ]);
            await bot.channelManager.sendLog('joinLeave', joinEmbed);
            logger.info(`Member joined: ${helpers_1.HelperUtils.formatUserTag(member)}`);
        }
        catch (error) {
            logger.error('Error in guildMemberAdd event:', error);
        }
    });
}
;
//# sourceMappingURL=guildMemberAdd.js.map