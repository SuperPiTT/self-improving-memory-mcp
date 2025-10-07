/**
 * Structured logging system with Winston
 * Provides consistent logging across all components
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Log levels: error, warn, info, http, verbose, debug, silly
// We use: error, warn, info, debug

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

/**
 * Create logger instance
 * @param {string} service - Service name (e.g., 'VectorStore', 'MCP-Server')
 * @param {Object} options - Logger options
 * @returns {winston.Logger}
 */
export function createLogger(service = 'app', options = {}) {
  const {
    level = process.env.LOG_LEVEL || 'info',
    logDir = path.join(process.cwd(), '.claude-memory', 'logs'),
    enableFile = process.env.NODE_ENV === 'production',
    enableConsole = true
  } = options;

  const transports = [];

  // Console logging (always in development, optional in production)
  if (enableConsole) {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        level
      })
    );
  }

  // File logging (production only by default)
  if (enableFile) {
    transports.push(
      // Error log
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      // Combined log
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    );
  }

  const logger = winston.createLogger({
    level,
    defaultMeta: { service },
    transports,
    exitOnError: false
  });

  return logger;
}

/**
 * Default logger instance for the application
 */
export const logger = createLogger('self-improving-memory');

/**
 * Performance logger - logs with timing information
 */
export class PerformanceLogger {
  constructor(logger, operation) {
    this.logger = logger;
    this.operation = operation;
    this.startTime = Date.now();
  }

  complete(metadata = {}) {
    const duration = Date.now() - this.startTime;
    this.logger.info(`${this.operation} completed`, {
      operation: this.operation,
      duration: `${duration}ms`,
      ...metadata
    });
    return duration;
  }

  fail(error, metadata = {}) {
    const duration = Date.now() - this.startTime;
    this.logger.error(`${this.operation} failed`, {
      operation: this.operation,
      duration: `${duration}ms`,
      error: error.message,
      stack: error.stack,
      ...metadata
    });
    return duration;
  }
}

/**
 * Create a performance logger for an operation
 * @param {string} operation - Operation name
 * @param {Object} metadata - Initial metadata
 * @returns {PerformanceLogger}
 */
export function logPerformance(operation, metadata = {}) {
  logger.debug(`${operation} started`, metadata);
  return new PerformanceLogger(logger, operation);
}

/**
 * Log retry attempt
 */
export function logRetry(operation, attempt, error, delay) {
  logger.warn(`Retry attempt ${attempt} for ${operation}`, {
    operation,
    attempt,
    error: error.message,
    retryDelay: `${delay}ms`
  });
}

/**
 * Log circuit breaker state change
 */
export function logCircuitBreaker(breaker, previousState, newState, reason) {
  const level = newState === 'OPEN' ? 'error' : 'info';
  logger[level](`Circuit breaker state changed: ${previousState} → ${newState}`, {
    breaker,
    previousState,
    newState,
    reason
  });
}

export default logger;
