"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleSheetsManager = void 0;
const googleapis_1 = require("googleapis");
const config_1 = require("@config/config");
const logger_1 = require("@utils/logger");
class GoogleSheetsManager {
    bot;
    logger;
    sheets;
    auth;
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('GoogleSheetsManager');
        this.initializeAuth();
    }
    async initializeAuth() {
        try {
            const credentials = JSON.parse(config_1.config.google.credentials);
            this.auth = new googleapis_1.google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
            this.sheets = googleapis_1.google.sheets({ version: 'v4', auth: this.auth });
            this.logger.info('Google Sheets authentication initialized');
        }
        catch (error) {
            this.logger.error('Failed to initialize Google Sheets auth:', error);
        }
    }
    async appendData(sheetName, data) {
        try {
            if (!this.sheets) {
                this.logger.error('Google Sheets not initialized');
                return false;
            }
            const response = await this.sheets.spreadsheets.values.append({
                spreadsheetId: config_1.config.google.sheetsId,
                range: `${sheetName}!A:Z`,
                valueInputOption: 'RAW',
                resource: {
                    values: data
                }
            });
            this.logger.info(`Appended ${data.length} rows to sheet: ${sheetName}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to append data to sheets:', error);
            return false;
        }
    }
    async createSheet(sheetName, headers) {
        try {
            if (!this.sheets) {
                this.logger.error('Google Sheets not initialized');
                return false;
            }
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: config_1.config.google.sheetsId,
                resource: {
                    requests: [{
                            addSheet: {
                                properties: {
                                    title: sheetName
                                }
                            }
                        }]
                }
            });
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: config_1.config.google.sheetsId,
                range: `${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
                valueInputOption: 'RAW',
                resource: {
                    values: [headers]
                }
            });
            this.logger.info(`Created sheet: ${sheetName} with headers`);
            return true;
        }
        catch (error) {
            if (error.message?.includes('already exists')) {
                this.logger.info(`Sheet ${sheetName} already exists`);
                return true;
            }
            this.logger.error('Failed to create sheet:', error);
            return false;
        }
    }
    async readData(sheetName, range) {
        try {
            if (!this.sheets) {
                this.logger.error('Google Sheets not initialized');
                return null;
            }
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: config_1.config.google.sheetsId,
                range: `${sheetName}!${range}`
            });
            return response.data.values || [];
        }
        catch (error) {
            this.logger.error('Failed to read data from sheets:', error);
            return null;
        }
    }
    async logTicketData(ticketData) {
        try {
            const sheetName = 'Tickets';
            await this.createSheet(sheetName, [
                'Ticket ID', 'Customer ID', 'Service', 'Status', 'Priority',
                'Created At', 'Closed At', 'Assigned Staff', 'Rating'
            ]);
            const row = [
                ticketData.ticketId,
                ticketData.customerId,
                ticketData.service,
                ticketData.status,
                ticketData.priority,
                ticketData.createdAt?.toISOString(),
                ticketData.closedAt?.toISOString() || '',
                ticketData.assignedStaff || '',
                ticketData.rating || ''
            ];
            return await this.appendData(sheetName, [row]);
        }
        catch (error) {
            this.logger.error('Failed to log ticket data:', error);
            return false;
        }
    }
    async logPaymentData(paymentData) {
        try {
            const sheetName = 'Payments';
            await this.createSheet(sheetName, [
                'Invoice ID', 'Customer ID', 'Amount', 'Type', 'Status',
                'Created At', 'Paid At', 'Staff ID', 'Product'
            ]);
            const row = [
                paymentData.invoiceId,
                paymentData.customerId,
                paymentData.amount,
                paymentData.isDeposit ? 'Deposit' : 'Full',
                paymentData.status,
                paymentData.createdAt?.toISOString(),
                paymentData.paidAt?.toISOString() || '',
                paymentData.staffId,
                paymentData.productName
            ];
            return await this.appendData(sheetName, [row]);
        }
        catch (error) {
            this.logger.error('Failed to log payment data:', error);
            return false;
        }
    }
    async logRatingData(ratingData) {
        try {
            const sheetName = 'Ratings';
            await this.createSheet(sheetName, [
                'Ticket ID', 'Customer ID', 'Rating', 'Feedback',
                'Staff ID', 'Timestamp'
            ]);
            const row = [
                ratingData.ticketId,
                ratingData.customerId,
                ratingData.rating,
                ratingData.feedback || '',
                ratingData.staffId || '',
                ratingData.timestamp?.toISOString()
            ];
            return await this.appendData(sheetName, [row]);
        }
        catch (error) {
            this.logger.error('Failed to log rating data:', error);
            return false;
        }
    }
}
exports.GoogleSheetsManager = GoogleSheetsManager;
//# sourceMappingURL=sheets.js.map