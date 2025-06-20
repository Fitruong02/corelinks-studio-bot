import { CorelinksBot } from '../../bot';
import { TicketData, ServiceType, TicketStatus, TicketPriority } from '../../types/ticket';
export declare class TicketManager {
    private bot;
    private logger;
    private activeTickets;
    private userTickets;
    private anonymousManager;
    private ratingManager;
    constructor(bot: CorelinksBot);
    createTicketRequest(userId: string, username: string, service: ServiceType, description: string): Promise<boolean>;
    approveTicket(ticketId: string, staffId: string): Promise<boolean>;
    closeTicket(ticketId: string, closedBy: string, reason?: string): Promise<boolean>;
    setTicketPriority(ticketId: string, priority: TicketPriority, staffId: string): Promise<boolean>;
    assignTicket(ticketId: string, staffId: string, assignedBy: string): Promise<boolean>;
    getTicketStatus(userId: string): Promise<TicketData | null>;
    handleButtonInteraction(interaction: any, params: string[]): Promise<void>;
    handleServiceSelection(interaction: any, params: string[]): Promise<void>;
    private sendTicketRequest;
    private startAutoCloseTimer;
    private checkInactiveTickets;
    private calculateTicketDuration;
    getActiveTicketsCount(): number;
    getTicketsByStatus(status: TicketStatus): TicketData[];
    getAllActiveTickets(): TicketData[];
}
//# sourceMappingURL=index.d.ts.map