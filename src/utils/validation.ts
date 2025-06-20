// ===== src/utils/validation.ts =====
export class ValidationManager {
  static isValidTicketId(ticketId: string): boolean {
    return /^TICKET-\d{4}$/.test(ticketId);
  }

  static isValidCustomerId(customerId: string): boolean {
    return /^CUST-\d{4}$/.test(customerId);
  }

  static isValidAmount(amount: number): boolean {
    return amount > 0 && amount <= 100000000; // Max 100M VND
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidDiscordId(id: string): boolean {
    return /^\d{17,19}$/.test(id);
  }

  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>@]/g, '');
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  static generateTicketId(): string {
    const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `TICKET-${randomNum}`;
  }

  static generateCustomerId(): string {
    const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `CUST-${randomNum}`;
  }

  static generateInvoiceId(): string {
    const timestamp = Date.now().toString();
    const randomNum = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    return `INV-${timestamp}-${randomNum}`;
  }
}