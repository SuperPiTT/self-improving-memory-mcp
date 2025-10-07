/**
 * Retry utility with exponential backoff and circuit breaker
 */

import { logger, logRetry, logCircuitBreaker } from './logger.js';

/**
 * Retry an async operation with exponential backoff
 * @param {Function} operation - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxAttempts - Maximum number of attempts (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 10000)
 * @param {number} options.backoffFactor - Multiplier for delay (default: 2)
 * @param {Function} options.shouldRetry - Function to determine if error should trigger retry
 * @param {Function} options.onRetry - Callback before each retry
 * @returns {Promise} Result of operation
 */
export async function retryWithBackoff(operation, options = {}) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    shouldRetry = () => true,
    onRetry = null
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Log retry attempt
      logger.warn(`Retry attempt ${attempt}`, {
        error: error.message,
        attempt,
        delay: `${delay}ms`,
        maxAttempts
      });

      // Call retry callback if provided
      if (onRetry) {
        onRetry(error, attempt, delay);
      }

      // Wait before retrying
      await sleep(delay);

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Retry with timeout
 * @param {Function} operation - Async function to execute
 * @param {number} timeout - Timeout in milliseconds
 * @param {Object} retryOptions - Options for retry
 * @returns {Promise} Result of operation
 */
export async function retryWithTimeout(operation, timeout, retryOptions = {}) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout);
  });

  const operationWithRetry = retryWithBackoff(operation, retryOptions);

  return Promise.race([operationWithRetry, timeoutPromise]);
}

/**
 * Circuit breaker pattern
 */
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds

    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }

  async execute(operation) {
    // If circuit is open, check if we should try again
    if (this.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;

      if (timeSinceLastFailure >= this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        throw new Error(`Circuit breaker is OPEN. Try again in ${this.resetTimeout - timeSinceLastFailure}ms`);
      }
    }

    try {
      const result = await operation();

      // Success
      if (this.state === 'HALF_OPEN') {
        this.successCount++;

        // After 3 successful attempts in half-open, close the circuit
        if (this.successCount >= 3) {
          this.state = 'CLOSED';
          this.failures = 0;
        }
      } else if (this.state === 'CLOSED') {
        this.failures = 0;
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.state === 'HALF_OPEN') {
        // If we fail in half-open state, go back to open
        this.state = 'OPEN';
      } else if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
      }

      throw error;
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Common retry predicates
 */
export const RetryPredicates = {
  // Retry on network errors
  isNetworkError: (error) => {
    return error.code === 'ECONNREFUSED' ||
           error.code === 'ETIMEDOUT' ||
           error.code === 'ENOTFOUND' ||
           error.message.includes('network') ||
           error.message.includes('timeout');
  },

  // Retry on temporary database errors
  isDatabaseError: (error) => {
    return error.message.includes('database') ||
           error.message.includes('connection') ||
           error.code === 'SQLITE_BUSY';
  },

  // Retry on any error
  always: () => true,

  // Never retry
  never: () => false,

  // Combine multiple predicates
  any: (...predicates) => (error) => {
    return predicates.some(predicate => predicate(error));
  }
};
