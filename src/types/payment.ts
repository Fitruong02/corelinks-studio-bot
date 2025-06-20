// ===== src/types/payment.ts =====
export interface InvoiceData {
  invoiceId: string;
  ticketId?: string;
  customerId: string;
  staffId: string;
  productName: string;
  amount: number;
  depositAmount?: number;
  isDeposit: boolean;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  payosOrderId?: string;
  paymentUrl?: string;
  qrCode?: string;
  expiresAt: Date;
  createdAt: Date;
  paidAt?: Date;
  refundedAt?: Date;
}

export enum PaymentMethod {
  BANKING = 'BANKING',
  MOMO = 'MOMO'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export interface RefundRequest {
  invoiceId: string;
  customerId: string;
  requestedBy: string;
  reason: string;
  amount: number;
  status: RefundStatus;
  createdAt: Date;
  processedAt?: Date;
  processedBy?: string;
}

export enum RefundStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  DENIED = 'denied',
  PROCESSED = 'processed'
}

export interface PayOSResponse {
  code: string;
  desc: string;
  data?: {
    bin: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    description: string;
    orderCode: number;
    currency: string;
    paymentLinkId: string;
    status: string;
    checkoutUrl: string;
    qrCode: string;
  };
}