// ===== src/modules/analytics/sheets.ts =====
import { CorelinksBot } from '../../bot';
import { google } from 'googleapis';
import { config } from '@config/config';
import { Logger } from '@utils/logger';

export class GoogleSheetsManager {
  private bot: CorelinksBot;
  private logger: Logger;
  private sheets: any;
  private auth: any;

  constructor(bot: CorelinksBot) {
    this.bot = bot;
    this.logger = new Logger('GoogleSheetsManager');
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    try {
      const credentials = JSON.parse(config.google.credentials);
      
      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      this.logger.info('Google Sheets authentication initialized');

    } catch (error) {
      this.logger.error('Failed to initialize Google Sheets auth:', error);
    }
  }

  async appendData(sheetName: string, data: any[]): Promise<boolean> {
    try {
      if (!this.sheets) {
        this.logger.error('Google Sheets not initialized');
        return false;
      }

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: config.google.sheetsId,
        range: `${sheetName}!A:Z`,
        valueInputOption: 'RAW',
        resource: {
          values: data
        }
      });

      this.logger.info(`Appended ${data.length} rows to sheet: ${sheetName}`);
      return true;

    } catch (error) {
      this.logger.error('Failed to append data to sheets:', error);
      return false;
    }
  }

  async createSheet(sheetName: string, headers: string[]): Promise<boolean> {
    try {
      if (!this.sheets) {
        this.logger.error('Google Sheets not initialized');
        return false;
      }

      // First, try to add the sheet
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: config.google.sheetsId,
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

      // Then add headers
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: config.google.sheetsId,
        range: `${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
        valueInputOption: 'RAW',
        resource: {
          values: [headers]
        }
      });

      this.logger.info(`Created sheet: ${sheetName} with headers`);
      return true;

    } catch (error) {
      if ((error as Error).message?.includes('already exists')) {
        this.logger.info(`Sheet ${sheetName} already exists`);
        return true;
      }
      this.logger.error('Failed to create sheet:', error);
      return false;
    }
  }

  async readData(sheetName: string, range: string): Promise<any[][] | null> {
    try {
      if (!this.sheets) {
        this.logger.error('Google Sheets not initialized');
        return null;
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: config.google.sheetsId,
        range: `${sheetName}!${range}`
      });

      return response.data.values || [];

    } catch (error) {
      this.logger.error('Failed to read data from sheets:', error);
      return null;
    }
  }

  async logTicketData(ticketData: any): Promise<boolean> {
    try {
      const sheetName = 'Tickets';
      
      // Ensure sheet exists
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

    } catch (error) {
      this.logger.error('Failed to log ticket data:', error);
      return false;
    }
  }

  async logPaymentData(paymentData: any): Promise<boolean> {
    try {
      const sheetName = 'Payments';
      
      // Ensure sheet exists
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

    } catch (error) {
      this.logger.error('Failed to log payment data:', error);
      return false;
    }
  }

  async logRatingData(ratingData: any): Promise<boolean> {
    try {
      const sheetName = 'Ratings';
      
      // Ensure sheet exists
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

    } catch (error) {
      this.logger.error('Failed to log rating data:', error);
      return false;
    }
  }
}