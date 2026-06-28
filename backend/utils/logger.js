const winston = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const isDev = process.env.NODE_ENV !== 'production';

// Human-readable format for development
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} [${level}] ${stack || message}${metaStr}`;
  })
);

// Structured JSON for production (ingestable by Datadog, CloudWatch, etc.)
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  format: isDev ? devFormat : prodFormat,
  defaultMeta: { service: 'prepai-backend' },
  transports: [
    new winston.transports.Console(),
    // Rotate logs in production — add winston-daily-rotate-file for file logging
    ...(!isDev
      ? [
          new winston.transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error',
            maxsize: 10 * 1024 * 1024, // 10 MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: path.join('logs', 'combined.log'),
            maxsize: 10 * 1024 * 1024,
            maxFiles: 10,
          }),
        ]
      : []),
  ],
  // Do not crash on unhandled promise rejections
  exitOnError: false,
});

module.exports = logger;
