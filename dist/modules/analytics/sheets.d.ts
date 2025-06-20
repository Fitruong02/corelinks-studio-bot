import { CorelinksBot } from '../../bot';
export declare class GoogleSheetsManager {
    private bot;
    private logger;
    private sheets;
    private auth;
    constructor(bot: CorelinksBot);
    private initializeAuth;
    appendData(sheetName: string, data: any[]): Promise<boolean>;
    createSheet(sheetName: string, headers: string[]): Promise<boolean>;
    readData(sheetName: string, range: string): Promise<any[][] | null>;
    logTicketData(ticketData: any): Promise<boolean>;
    logPaymentData(paymentData: any): Promise<boolean>;
    logRatingData(ratingData: any): Promise<boolean>;
}
//# sourceMappingURL=sheets.d.ts.map