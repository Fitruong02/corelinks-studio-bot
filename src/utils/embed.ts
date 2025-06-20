// ===== src/utils/embed.ts =====
import { EmbedBuilder, ColorResolvable } from 'discord.js';

export class EmbedManager {
  private static readonly COLORS = {
    SUCCESS: '#00ff00' as ColorResolvable,
    ERROR: '#ff0000' as ColorResolvable,
    WARNING: '#ffff00' as ColorResolvable,
    INFO: '#0099ff' as ColorResolvable,
    PRIMARY: '#5865f2' as ColorResolvable,
    SECONDARY: '#99aab5' as ColorResolvable
  };

  static createSuccessEmbed(title: string, description?: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(this.COLORS.SUCCESS)
      .setTitle(`✅ ${title}`)
      .setDescription(description || null)
      .setTimestamp();
  }

  static createErrorEmbed(title: string, description?: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(this.COLORS.ERROR)
      .setTitle(`❌ ${title}`)
      .setDescription(description || null)
      .setTimestamp();
  }

  static createWarningEmbed(title: string, description?: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(this.COLORS.WARNING)
      .setTitle(`⚠️ ${title}`)
      .setDescription(description || null)
      .setTimestamp();
  }

  static createInfoEmbed(title: string, description?: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(this.COLORS.INFO)
      .setTitle(`ℹ️ ${title}`)
      .setDescription(description || null)
      .setTimestamp();
  }

  static createTicketEmbed(ticketId: string, customerId: string, service: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(this.COLORS.PRIMARY)
      .setTitle('🎫 Yêu cầu Ticket Mới')
      .addFields(
        { name: 'Mã Ticket', value: `\`${ticketId}\``, inline: true },
        { name: 'Mã Khách hàng', value: `\`${customerId}\``, inline: true },
        { name: 'Dịch vụ', value: service, inline: true }
      )
      .setTimestamp();
  }

  static createPaymentEmbed(invoiceId: string, amount: number, productName: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(this.COLORS.PRIMARY)
      .setTitle('💰 Hóa đơn Thanh toán')
      .addFields(
        { name: 'Mã hóa đơn', value: `\`${invoiceId}\``, inline: true },
        { name: 'Sản phẩm', value: productName, inline: true },
        { name: 'Số tiền', value: `${amount.toLocaleString('vi-VN')} VND`, inline: true }
      )
      .setTimestamp();
  }

  static createModerationEmbed(action: string, target: string, reason: string, moderator: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(this.COLORS.WARNING)
      .setTitle(`🛡️ Hành động Moderation`)
      .addFields(
        { name: 'Hành động', value: action, inline: true },
        { name: 'Đối tượng', value: target, inline: true },
        { name: 'Người thực hiện', value: moderator, inline: true },
        { name: 'Lý do', value: reason || 'Không có lý do', inline: false }
      )
      .setTimestamp();
  }

  static createLogEmbed(title: string, description: string, fields: { name: string; value: string; inline?: boolean }[] = []): EmbedBuilder {
    const embed = new EmbedBuilder()
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