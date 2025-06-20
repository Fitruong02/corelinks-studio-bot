import { CorelinksBot } from '../../bot';
import { InvoiceData } from '../../types/payment';
export declare class InvoiceManager {
    private bot;
    private logger;
    constructor(bot: CorelinksBot);
    sendInvoiceToCustomer(invoice: InvoiceData): Promise<void>;
    showInvoiceDetails(interaction: any, invoiceId: string): Promise<void>;
    notifyPaymentSuccess(invoice: InvoiceData): Promise<void>;
    notifyPaymentCancellation(invoice: InvoiceData, reason: string): Promise<void>;
    sendPaymentReminder(invoice: InvoiceData): Promise<void>;
}
export {};
//# sourceMappingURL=invoice.d.ts.map