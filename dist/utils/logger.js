"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
const config_1 = require("@config/config");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    context;
    logLevel;
    constructor(context) {
        this.context = context;
        this.logLevel = this.parseLogLevel(config_1.config.settings.logLevel);
    }
    parseLogLevel(level) {
        switch (level.toLowerCase()) {
            case 'debug': return LogLevel.DEBUG;
            case 'info': return LogLevel.INFO;
            case 'warn': return LogLevel.WARN;
            case 'error': return LogLevel.ERROR;
            default: return LogLevel.INFO;
        }
    }
    formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const formattedArgs = args.length > 0 ? ' ' + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ') : '';
        return `[${timestamp}] [${level}] [${this.context}] ${message}${formattedArgs}`;
    }
    getColorCode(level) {
        switch (level) {
            case 'DEBUG': return '\x1b[36m';
            case 'INFO': return '\x1b[32m';
            case 'WARN': return '\x1b[33m';
            case 'ERROR': return '\x1b[31m';
            default: return '\x1b[0m';
        }
    }
    resetColor() {
        return '\x1b[0m';
    }
    debug(message, ...args) {
        if (this.logLevel <= LogLevel.DEBUG) {
            const formattedMessage = this.formatMessage('DEBUG', message, ...args);
            console.log(`${this.getColorCode('DEBUG')}${formattedMessage}${this.resetColor()}`);
        }
    }
    info(message, ...args) {
        if (this.logLevel <= LogLevel.INFO) {
            const formattedMessage = this.formatMessage('INFO', message, ...args);
            console.log(`${this.getColorCode('INFO')}${formattedMessage}${this.resetColor()}`);
        }
    }
    warn(message, ...args) {
        if (this.logLevel <= LogLevel.WARN) {
            const formattedMessage = this.formatMessage('WARN', message, ...args);
            console.warn(`${this.getColorCode('WARN')}${formattedMessage}${this.resetColor()}`);
        }
    }
    error(message, ...args) {
        if (this.logLevel <= LogLevel.ERROR) {
            const formattedMessage = this.formatMessage('ERROR', message, ...args);
            console.error(`${this.getColorCode('ERROR')}${formattedMessage}${this.resetColor()}`);
        }
    }
    trace(message, ...args) {
        if (this.logLevel <= LogLevel.DEBUG) {
            const error = new Error();
            const stack = error.stack?.split('\n').slice(2, 5).join('\n') || 'No stack trace';
            this.debug(`${message}\nStack trace:\n${stack}`, ...args);
        }
    }
    setLogLevel(level) {
        this.logLevel = level;
    }
    getLogLevel() {
        return this.logLevel;
    }
    log(level, message, ...args) {
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
    static createLogger(context, level) {
        const logger = new Logger(context);
        if (level !== undefined) {
            logger.setLogLevel(level);
        }
        return logger;
    }
    time(label) {
        console.time(`[${this.context}] ${label}`);
    }
    timeEnd(label) {
        console.timeEnd(`[${this.context}] ${label}`);
    }
    structured(level, data) {
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
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map