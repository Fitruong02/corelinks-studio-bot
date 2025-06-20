export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
export declare class Logger {
    private context;
    private logLevel;
    constructor(context: string);
    private parseLogLevel;
    private formatMessage;
    private getColorCode;
    private resetColor;
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    trace(message: string, ...args: any[]): void;
    setLogLevel(level: LogLevel): void;
    getLogLevel(): LogLevel;
    log(level: LogLevel, message: string, ...args: any[]): void;
    static createLogger(context: string, level?: LogLevel): Logger;
    time(label: string): void;
    timeEnd(label: string): void;
    structured(level: LogLevel, data: Record<string, any>): void;
}
//# sourceMappingURL=logger.d.ts.map