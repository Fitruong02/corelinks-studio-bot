export declare class ValidationManager {
    static isValidTicketId(ticketId: string): boolean;
    static isValidCustomerId(customerId: string): boolean;
    static isValidAmount(amount: number): boolean;
    static isValidEmail(email: string): boolean;
    static isValidDiscordId(id: string): boolean;
    static sanitizeInput(input: string): string;
    static isValidUrl(url: string): boolean;
    static truncateText(text: string, maxLength: number): string;
    static formatCurrency(amount: number): string;
    static generateTicketId(): string;
    static generateCustomerId(): string;
    static generateInvoiceId(): string;
}
//# sourceMappingURL=validation.d.ts.map