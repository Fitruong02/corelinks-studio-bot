// ===== src/types/ticket.ts =====
export interface TicketData {
  ticketId: string;
  customerId: string;
  userId: string;
  username: string;
  service: ServiceType;
  status: TicketStatus;
  priority: TicketPriority;
  assignedStaff?: string;
  channelId?: string;
  createdAt: Date;
  lastActivity: Date;
  closedAt?: Date;
  rating?: number;
  feedback?: string;
}

export enum ServiceType {
  GAME = 'Game',
  DISCORD = 'Discord',
  MINECRAFT = 'Minecraft'
}

export enum TicketStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  ACTIVE = 'active',
  WAITING = 'waiting',
  CLOSED = 'closed'
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface TicketRequest {
  userId: string;
  username: string;
  service: ServiceType;
  description: string;
  timestamp: Date;
}

export interface TicketRating {
  ticketId: string;
  customerId: string;
  rating: number;
  feedback?: string;
  staffId?: string;
  timestamp: Date;
}
