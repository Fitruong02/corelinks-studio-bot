"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationManager = void 0;
class ValidationManager {
    static isValidTicketId(ticketId) {
        return /^TICKET-\d{4}$/.test(ticketId);
    }
    static isValidCustomerId(customerId) {
        return /^CUST-\d{4}$/.test(customerId);
    }
    static isValidAmount(amount) {
        return amount > 0 && amount <= 100000000;
    }
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    static isValidDiscordId(id) {
        return /^\d{17,19}$/.test(id);
    }
    static sanitizeInput(input) {
        return input.trim().replace(/[<>@]/g, '');
    }
    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    }
    static truncateText(text, maxLength) {
        if (text.length <= maxLength)
            return text;
        return text.substring(0, maxLength - 3) + '...';
    }
    static formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }
    static generateTicketId() {
        const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
        return `TICKET-${randomNum}`;
    }
    static generateCustomerId() {
        const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
        return `CUST-${randomNum}`;
    }
    static generateInvoiceId() {
        const timestamp = Date.now().toString();
        const randomNum = Math.floor(Math.random() * 999).toString().padStart(3, '0');
        return `INV-${timestamp}-${randomNum}`;
    }
}
exports.ValidationManager = ValidationManager;
//# sourceMappingURL=validation.js.map