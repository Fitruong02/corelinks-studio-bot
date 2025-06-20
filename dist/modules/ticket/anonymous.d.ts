import { CorelinksBot } from '../../bot';
import { TicketData } from '../../types/ticket';
export declare class AnonymousManager {
    private bot;
    private logger;
    private anonymousChannels;
    private dmProxies;
    constructor(bot: CorelinksBot);
    setupAnonymousChannel(ticket: TicketData, channelId: string): Promise<void>;
    handleCustomerDM(message: any): Promise<void>;
    handleStaffMessage(message: any, ticketId: string): Promise<void>;
    private forwardMessageToStaff;
    private forwardMessageToCustomer;
    private sendTicketStatus;
    private handleCustomerClose;
    private getTicketData;
    removeAnonymousMapping(ticketId: string): void;
    isAnonymousChannel(channelId: string): boolean;
    getTicketFromChannel(channelId: string): string | null;
}
//# sourceMappingURL=anonymous.d.ts.map