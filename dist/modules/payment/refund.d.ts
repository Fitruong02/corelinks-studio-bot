import { CorelinksBot } from '../../bot';
import { RefundRequest } from '../../types/payment';
export declare class RefundManager {
    private bot;
    private logger;
    private activeRefunds;
    constructor(bot: CorelinksBot);
    createRefundRequest(invoiceId: string, customerId: string, reason: string): Promise<boolean>;
    processRefundRequest(invoiceId: string, staffId: string, approved: boolean, reason?: string): Promise<boolean>;
    initiateStaffRefund(interaction: any, invoiceId: string): Promise<void>;
    initiateCustomerRefund(interaction: any, invoiceId: string): Promise<void>;
    private sendRefundRequestToStaff;
    private executeRefund;
    private notifyRefundDecision;
    getActiveRefunds(): RefundRequest[];
    getRefundByInvoice(invoiceId: string): RefundRequest | null;
}
//# sourceMappingURL=refund.d.ts.map