'use strict';

const winston = require('winston');
const path = require('path');

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

// ─── Custom console format ───────────────────────────────────────────────────
const consoleFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}]: ${stack || message}`;
});

// ─── Transport selection based on environment ─────────────────────────────────
const transports = [];

if (process.env.NODE_ENV === 'production') {
  // Write errors to dedicated file, everything to combined
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: combine(errors({ stack: true }), timestamp(), json()),
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: combine(errors({ stack: true }), timestamp(), json()),
    })
  );
} else {
  // Development: colorized, human-readable console output
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'HH:mm:ss' }),
        errors({ stack: true }),
        consoleFormat
      ),
    })
  );
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports,
  // Do NOT exit on handled exceptions — let uncaughtException handler do it
  exitOnError: false,
});

// ─── Morgan stream integration ────────────────────────────────────────────────
// Morgan writes HTTP access logs at the 'http' level
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;
