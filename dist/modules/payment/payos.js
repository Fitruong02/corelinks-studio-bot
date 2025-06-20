"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayOSManager = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("@config/config");
const logger_1 = require("@utils/logger");
class PayOSManager {
    bot;
    logger;
    baseUrl = 'https://api-merchant.payos.vn';
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('PayOSManager');
    }
    async createPaymentLink(invoice) {
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
            const response = await axios_1.default.post(`${this.baseUrl}/v2/payment-requests`, paymentData, {
                headers: {
                    'x-client-id': config_1.config.payos.clientId,
                    'x-api-key': config_1.config.payos.apiKey,
                    'x-partner-code': config_1.config.payos.clientId,
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
            }
            else {
                this.logger.error('PayOS payment creation failed:', response.data);
                return null;
            }
        }
        catch (error) {
            this.logger.error('Failed to create PayOS payment link:', error);
            return null;
        }
    }
    async getPaymentInfo(orderCode) {
        try {
            const signature = this.generateGetSignature(orderCode);
            const response = await axios_1.default.get(`${this.baseUrl}/v2/payment-requests/${orderCode}`, {
                headers: {
                    'x-client-id': config_1.config.payos.clientId,
                    'x-api-key': config_1.config.payos.apiKey,
                    'x-partner-code': config_1.config.payos.clientId,
                    'x-signature': signature
                }
            });
            if (response.data.code === '00') {
                return response.data.data;
            }
            else {
                this.logger.error('PayOS payment info fetch failed:', response.data);
                return null;
            }
        }
        catch (error) {
            this.logger.error('Failed to get PayOS payment info:', error);
            return null;
        }
    }
    async cancelPayment(orderCode, reason) {
        try {
            const cancelData = {
                orderCode: parseInt(orderCode),
                cancellationReason: reason
            };
            const signature = this.generateSignature(cancelData);
            const response = await axios_1.default.put(`${this.baseUrl}/v2/payment-requests/${orderCode}/cancel`, cancelData, {
                headers: {
                    'x-client-id': config_1.config.payos.clientId,
                    'x-api-key': config_1.config.payos.apiKey,
                    'x-partner-code': config_1.config.payos.clientId,
                    'x-signature': signature,
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.code === '00') {
                this.logger.info(`Cancelled PayOS payment ${orderCode}`);
                return true;
            }
            else {
                this.logger.error('PayOS payment cancellation failed:', response.data);
                return false;
            }
        }
        catch (error) {
            this.logger.error('Failed to cancel PayOS payment:', error);
            return false;
        }
    }
    verifyWebhookSignature(data, signature) {
        try {
            const expectedSignature = this.generateSignature(data);
            return expectedSignature === signature;
        }
        catch (error) {
            this.logger.error('Failed to verify webhook signature:', error);
            return false;
        }
    }
    generateSignature(data) {
        const sortedKeys = Object.keys(data).sort();
        const signaturePayload = sortedKeys
            .map(key => `${key}=${data[key]}`)
            .join('&');
        return crypto_1.default
            .createHmac('sha256', config_1.config.payos.checksumKey)
            .update(signaturePayload)
            .digest('hex');
    }
    generateGetSignature(orderCode) {
        const signaturePayload = `orderCode=${orderCode}`;
        return crypto_1.default
            .createHmac('sha256', config_1.config.payos.checksumKey)
            .update(signaturePayload)
            .digest('hex');
    }
}
exports.PayOSManager = PayOSManager;
//# sourceMappingURL=payos.js.map