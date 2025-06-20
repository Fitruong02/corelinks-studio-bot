import { EmbedBuilder } from 'discord.js';
export declare class EmbedManager {
    private static readonly COLORS;
    static createSuccessEmbed(title: string, description?: string): EmbedBuilder;
    static createErrorEmbed(title: string, description?: string): EmbedBuilder;
    static createWarningEmbed(title: string, description?: string): EmbedBuilder;
    static createInfoEmbed(title: string, description?: string): EmbedBuilder;
    static createTicketEmbed(ticketId: string, customerId: string, service: string): EmbedBuilder;
    static createPaymentEmbed(invoiceId: string, amount: number, productName: string): EmbedBuilder;
    static createModerationEmbed(action: string, target: string, reason: string, moderator: string): EmbedBuilder;
    static createLogEmbed(title: string, description: string, fields?: {
        name: string;
        value: string;
        inline?: boolean;
    }[]): EmbedBuilder;
}
//# sourceMappingURL=embed.d.ts.map