const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Define logging colors for different levels
winston.addColors({
    error: 'red',
    warn: 'yellow',
    info: 'blue',
    debug: 'green'
});

// Uppercase level formatter
const uppercaseLevelFormat = winston.format((info) => {
    info.level = info.level.toUpperCase();
    return info;
})();

// Environment variables for configuration
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_FILE_PATH = path.join(process.env.LOG_DIRECTORY || '/tmp', 'application-%DATE%.log'); // Use /tmp for serverless environments
const MAX_FILES = process.env.LOG_INTERVAL_DELETION || '3d';

// Create logger instance
const log = winston.createLogger({
    level: LOG_LEVEL,
    format: winston.format.combine(
        uppercaseLevelFormat,
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ level, message, timestamp }) => {
            return `[${timestamp}] [${level}]: ${message}`;
        })
    ),
    transports: [
        // Console transport for serverless logging
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ level, message, timestamp }) => {
                    return `[${timestamp}] [${level}]: ${message}`;
                })
            )
        }),
        // File-based logging for local environments
        new DailyRotateFile({
            filename: LOG_FILE_PATH,
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: MAX_FILES
        })
    ]
});

// Handle exceptions with file-based logging (if enabled)
if (process.env.LOG_DIRECTORY) {
    log.exceptions.handle(
        new DailyRotateFile({
            filename: path.join(process.env.LOG_DIRECTORY || '/tmp', 'exceptions-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d'
        })
    );
}

// Log unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    log.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

// Capture logging errors
log.on('error', function (err) {
    console.error('Logger error:', err);
});

module.exports = log;
