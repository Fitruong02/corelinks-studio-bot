import { CorelinksBot } from '../../bot';
import { InvoiceData } from '../../types/payment';
export declare class PayOSManager {
    private bot;
    private logger;
    private readonly baseUrl;
    constructor(bot: CorelinksBot);
    createPaymentLink(invoice: InvoiceData): Promise<{
        orderCode: string;
        checkoutUrl: string;
        qrCode: string;
    } | null>;
    getPaymentInfo(orderCode: string): Promise<any | null>;
    cancelPayment(orderCode: string, reason: string): Promise<boolean>;
    verifyWebhookSignature(data: any, signature: string): boolean;
    private generateSignature;
    private generateGetSignature;
}
//# sourceMappingURL=payos.d.ts.map