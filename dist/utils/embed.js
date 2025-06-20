"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbedManager = void 0;
const discord_js_1 = require("discord.js");
class EmbedManager {
    static COLORS = {
        SUCCESS: '#00ff00',
        ERROR: '#ff0000',
        WARNING: '#ffff00',
        INFO: '#0099ff',
        PRIMARY: '#5865f2',
        SECONDARY: '#99aab5'
    };
    static createSuccessEmbed(title, description) {
        return new discord_js_1.EmbedBuilder()
            .setColor(this.COLORS.SUCCESS)
            .setTitle(`✅ ${title}`)
            .setDescription(description || null)
            .setTimestamp();
    }
    static createErrorEmbed(title, description) {
        return new discord_js_1.EmbedBuilder()
            .setColor(this.COLORS.ERROR)
            .setTitle(`❌ ${title}`)
            .setDescription(description || null)
            .setTimestamp();
    }
    static createWarningEmbed(title, description) {
        return new discord_js_1.EmbedBuilder()
            .setColor(this.COLORS.WARNING)
            .setTitle(`⚠️ ${title}`)
            .setDescription(description || null)
            .setTimestamp();
    }
    static createInfoEmbed(title, description) {
        return new discord_js_1.EmbedBuilder()
            .setColor(this.COLORS.INFO)
            .setTitle(`ℹ️ ${title}`)
            .setDescription(description || null)
            .setTimestamp();
    }
    static createTicketEmbed(ticketId, customerId, service) {
        return new discord_js_1.EmbedBuilder()
            .setColor(this.COLORS.PRIMARY)
            .setTitle('🎫 Yêu cầu Ticket Mới')
            .addFields({ name: 'Mã Ticket', value: `\`${ticketId}\``, inline: true }, { name: 'Mã Khách hàng', value: `\`${customerId}\``, inline: true }, { name: 'Dịch vụ', value: service, inline: true })
            .setTimestamp();
    }
    static createPaymentEmbed(invoiceId, amount, productName) {
        return new discord_js_1.EmbedBuilder()
            .setColor(this.COLORS.PRIMARY)
            .setTitle('💰 Hóa đơn Thanh toán')
            .addFields({ name: 'Mã hóa đơn', value: `\`${invoiceId}\``, inline: true }, { name: 'Sản phẩm', value: productName, inline: true }, { name: 'Số tiền', value: `${amount.toLocaleString('vi-VN')} VND`, inline: true })
            .setTimestamp();
    }
    static createModerationEmbed(action, target, reason, moderator) {
        return new discord_js_1.EmbedBuilder()
            .setColor(this.COLORS.WARNING)
            .setTitle(`🛡️ Hành động Moderation`)
            .addFields({ name: 'Hành động', value: action, inline: true }, { name: 'Đối tượng', value: target, inline: true }, { name: 'Người thực hiện', value: moderator, inline: true }, { name: 'Lý do', value: reason || 'Không có lý do', inline: false })
            .setTimestamp();
    }
    static createLogEmbed(title, description, fields = []) {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(this.COLORS.SECONDARY)
            .setTitle(title)
            .setDescription(description)
            .setTimestamp();
        if (fields.length > 0) {
            embed.addFields(fields);
        }
        return embed;
    }
}
exports.EmbedManager = EmbedManager;
//# sourceMappingURL=embed.js.map