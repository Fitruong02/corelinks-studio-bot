"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelperUtils = void 0;
const discord_js_1 = require("discord.js");
const logger_1 = require("@utils/logger");
class HelperUtils {
    static logger = new logger_1.Logger('HelperUtils');
    static async sleep(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }
    static formatUserTag(user) {
        const userData = user instanceof discord_js_1.GuildMember ? user.user : user;
        return `${userData.tag} (${userData.id})`;
    }
    static formatTimestamp(date) {
        return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
    }
    static formatRelativeTime(date) {
        return `<t:${Math.floor(date.getTime() / 1000)}:R>`;
    }
    static async safeChannelSend(channel, content) {
        try {
            await channel.send(content);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send message to channel ${channel.name}:`, error);
            return false;
        }
    }
    static async safeDMSend(user, content) {
        try {
            await user.send(content);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send DM to ${user.tag}:`, error);
            return false;
        }
    }
    static getWeekStart(date = new Date()) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }
    static escapeMarkdown(text) {
        return text.replace(/[\\`*_{}[\]()~>#+\-=|.!]/g, '\\$&');
    }
    static chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
    static randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    static calculatePercentage(value, total) {
        return total === 0 ? 0 : Math.round((value / total) * 100);
    }
}
exports.HelperUtils = HelperUtils;
//# sourceMappingURL=helpers.js.map