import { CorelinksBot } from '../../bot';
import { InvoiceData, PaymentStatus } from '../../types/payment';
export declare class PaymentManager {
    private bot;
    private logger;
    private activeInvoices;
    private payosManager;
    private invoiceManager;
    private refundManager;
    constructor(bot: CorelinksBot);
    createInvoice(staffId: string, customerId: string, productName: string, amount: number, isDeposit?: boolean, depositAmount?: number, ticketId?: string): Promise<InvoiceData | null>;
    processPaymentWebhook(webhookData: any): Promise<void>;
    completePayment(invoiceId: string): Promise<boolean>;
    cancelPayment(invoiceId: string, reason: string): Promise<boolean>;
    requestRefund(invoiceId: string, customerId: string, reason: string): Promise<boolean>;
    processRefund(invoiceId: string, staffId: string, approved: boolean, reason?: string): Promise<boolean>;
    getInvoiceStatus(invoiceId: string): Promise<InvoiceData | null>;
    handleButtonInteraction(interaction: any, params: string[]): Promise<void>;
    private scheduleDepositReminder;
    private startExpirationTimer;
    private checkExpiredInvoices;
    getActiveInvoicesCount(): number;
    getPendingAmount(): number;
    getInvoicesByStatus(status: PaymentStatus): InvoiceData[];
}
//# sourceMappingURL=index.d.ts.map