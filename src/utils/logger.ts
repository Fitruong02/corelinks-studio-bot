// ===== src/utils/logger.ts =====
import { config } from '@config/config';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  private context: string;
  private logLevel: LogLevel;

  constructor(context: string) {
    this.context = context;
    this.logLevel = this.parseLogLevel(config.settings.logLevel);
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      default: return LogLevel.INFO;
    }
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';
    
    return `[${timestamp}] [${level}] [${this.context}] ${message}${formattedArgs}`;
  }

  private getColorCode(level: string): string {
    switch (level) {
      case 'DEBUG': return '\x1b[36m'; // Cyan
      case 'INFO': return '\x1b[32m';  // Green
      case 'WARN': return '\x1b[33m';  // Yellow
      case 'ERROR': return '\x1b[31m'; // Red
      default: return '\x1b[0m';       // Reset
    }
  }

  private resetColor(): string {
    return '\x1b[0m';
  }

  debug(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      const formattedMessage = this.formatMessage('DEBUG', message, ...args);
      console.log(`${this.getColorCode('DEBUG')}${formattedMessage}${this.resetColor()}`);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.INFO) {
      const formattedMessage = this.formatMessage('INFO', message, ...args);
      console.log(`${this.getColorCode('INFO')}${formattedMessage}${this.resetColor()}`);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.WARN) {
      const formattedMessage = this.formatMessage('WARN', message, ...args);
      console.warn(`${this.getColorCode('WARN')}${formattedMessage}${this.resetColor()}`);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.ERROR) {
      const formattedMessage = this.formatMessage('ERROR', message, ...args);
      console.error(`${this.getColorCode('ERROR')}${formattedMessage}${this.resetColor()}`);
    }
  }

  // Additional utility methods
  trace(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      const error = new Error();
      const stack = error.stack?.split('\n').slice(2, 5).join('\n') || 'No stack trace';
      this.debug(`${message}\nStack trace:\n${stack}`, ...args);
    }
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  getLogLevel(): LogLevel {
    return this.logLevel;
  }

  // Method for logging with custom level
  log(level: LogLevel, message: string, ...args: any[]): void {
    switch (level) {
      case LogLevel.DEBUG:
        this.debug(message, ...args);
        break;
      case LogLevel.INFO:
        this.info(message, ...args);
        break;
      case LogLevel.WARN:
        this.warn(message, ...args);
        break;
      case LogLevel.ERROR:
        this.error(message, ...args);
        break;
    }
  }

  // Static method to create logger with specified level
  static createLogger(context: string, level?: LogLevel): Logger {
    const logger = new Logger(context);
    if (level !== undefined) {
      logger.setLogLevel(level);
    }
    return logger;
  }

  // Method for logging performance metrics
  time(label: string): void {
    console.time(`[${this.context}] ${label}`);
  }

  timeEnd(label: string): void {
    console.timeEnd(`[${this.context}] ${label}`);
  }

  // Method for structured logging (useful for JSON logs)
  structured(level: LogLevel, data: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      context: this.context,
      ...data
    };

    if (this.logLevel <= level) {
      console.log(JSON.stringify(logEntry, null, 2));
    }
  }
}