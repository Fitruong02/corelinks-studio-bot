import { CorelinksBot } from '../../bot';
import { TicketData } from '../../types/ticket';
export declare class TicketApprovalManager {
    private bot;
    private logger;
    constructor(bot: CorelinksBot);
    createApprovalMessage(ticket: TicketData, description: string): Promise<void>;
    private createServiceAssignmentRow;
    handleApproval(ticketId: string, staffId: string): Promise<boolean>;
    handleRejection(ticketId: string, staffId: string, reason?: string): Promise<boolean>;
    handleServiceAssignment(ticketId: string, assignmentType: string, staffId: string): Promise<boolean>;
    private autoAssignByService;
    private requestManualAssignment;
    private getServiceRoleId;
    private getTicketUser;
}
//# sourceMappingURL=approval.d.ts.map