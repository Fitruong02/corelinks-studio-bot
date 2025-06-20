// ===== src/modules/payment/payos.ts =====
import axios from 'axios';
import crypto from 'crypto';
import { CorelinksBot } from '../../bot';
import { InvoiceData, PayOSResponse } from '../../types/payment';
import { config } from '@config/config';
import { Logger } from '@utils/logger';

export class PayOSManager {
  private bot: CorelinksBot;
  private logger: Logger;
  private readonly baseUrl = 'https://api-merchant.payos.vn';

  constructor(bot: CorelinksBot) {
    this.bot = bot;
    this.logger = new Logger('PayOSManager');
  }

  async createPaymentLink(invoice: InvoiceData): Promise<{ orderCode: string; checkoutUrl: string; qrCode: string } | null> {
    try {
      const finalAmount = invoice.isDeposit && invoice.depositAmount 
        ? invoice.depositAmount 
        : invoice.amount;

      const orderCode = parseInt(Date.now().toString().slice(-10));
      const description = `${invoice.productName} - ${invoice.invoiceId}`;

      const paymentData = {
        orderCode,
        amount: finalAmount,
        description,
        items: [
          {
            name: invoice.productName,
            quantity: 1,
            price: finalAmount
          }
        ],
        returnUrl: `${process.env.WEBSITE_URL || 'https://corelinks.studio'}/payment/success`,
        cancelUrl: `${process.env.WEBSITE_URL || 'https://corelinks.studio'}/payment/cancel`
      };

      const signature = this.generateSignature(paymentData);

      const response = await axios.post(`${this.baseUrl}/v2/payment-requests`, paymentData, {
        headers: {
          'x-client-id': config.payos.clientId,
          'x-api-key': config.payos.apiKey,
          'x-partner-code': config.payos.clientId,
          'x-signature': signature,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.code === '00') {
        this.logger.info(`Created PayOS payment link for invoice ${invoice.invoiceId}`);
        return {
          orderCode: orderCode.toString(),
          checkoutUrl: response.data.data.checkoutUrl,
          qrCode: response.data.data.qrCode
        };
      } else {
        this.logger.error('PayOS payment creation failed:', response.data);
        return null;
      }

    } catch (error) {
      this.logger.error('Failed to create PayOS payment link:', error);
      return null;
    }
  }

  async getPaymentInfo(orderCode: string): Promise<any | null> {
    try {
      const signature = this.generateGetSignature(orderCode);

      const response = await axios.get(`${this.baseUrl}/v2/payment-requests/${orderCode}`, {
        headers: {
          'x-client-id': config.payos.clientId,
          'x-api-key': config.payos.apiKey,
          'x-partner-code': config.payos.clientId,
          'x-signature': signature
        }
      });

      if (response.data.code === '00') {
        return response.data.data;
      } else {
        this.logger.error('PayOS payment info fetch failed:', response.data);
        return null;
      }

    } catch (error) {
      this.logger.error('Failed to get PayOS payment info:', error);
      return null;
    }
  }

  async cancelPayment(orderCode: string, reason: string): Promise<boolean> {
    try {
      const cancelData = {
        orderCode: parseInt(orderCode),
        cancellationReason: reason
      };

      const signature = this.generateSignature(cancelData);

      const response = await axios.put(`${this.baseUrl}/v2/payment-requests/${orderCode}/cancel`, cancelData, {
        headers: {
          'x-client-id': config.payos.clientId,
          'x-api-key': config.payos.apiKey,
          'x-partner-code': config.payos.clientId,
          'x-signature': signature,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.code === '00') {
        this.logger.info(`Cancelled PayOS payment ${orderCode}`);
        return true;
      } else {
        this.logger.error('PayOS payment cancellation failed:', response.data);
        return false;
      }

    } catch (error) {
      this.logger.error('Failed to cancel PayOS payment:', error);
      return false;
    }
  }

  verifyWebhookSignature(data: any, signature: string): boolean {
    try {
      const expectedSignature = this.generateSignature(data);
      return expectedSignature === signature;
    } catch (error) {
      this.logger.error('Failed to verify webhook signature:', error);
      return false;
    }
  }

  private generateSignature(data: any): string {
    const sortedKeys = Object.keys(data).sort();
    const signaturePayload = sortedKeys
      .map(key => `${key}=${data[key]}`)
      .join('&');

    return crypto
      .createHmac('sha256', config.payos.checksumKey)
      .update(signaturePayload)
      .digest('hex');
  }

  private generateGetSignature(orderCode: string): string {
    const signaturePayload = `orderCode=${orderCode}`;
    
    return crypto
      .createHmac('sha256', config.payos.checksumKey)
      .update(signaturePayload)
      .digest('hex');
  }
}
