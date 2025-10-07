/**
 * Performance Monitoring System
 * Tracks metrics for operations, embeddings, searches, and database size
 */

import { logger } from './logger.js';

/**
 * Performance metrics storage
 */
class PerformanceMetrics {
  constructor() {
    this.metrics = {
      embeddings: {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0,
        history: [] // Last 100 measurements
      },
      searches: {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0,
        history: []
      },
      database: {
        size: 0, // Number of vectors
        lastUpdated: null
      },
      operations: {} // Generic operation tracking
    };
  }

  /**
   * Record embedding generation time
   * @param {number} duration - Time in milliseconds
   */
  recordEmbedding(duration) {
    const m = this.metrics.embeddings;
    m.count++;
    m.totalTime += duration;
    m.avgTime = m.totalTime / m.count;
    m.minTime = Math.min(m.minTime, duration);
    m.maxTime = Math.max(m.maxTime, duration);

    // Keep last 100 measurements
    m.history.push({ timestamp: Date.now(), duration });
    if (m.history.length > 100) {
      m.history.shift();
    }

    // Log slow embeddings
    if (duration > 1000) {
      logger.warn('Slow embedding generation', {
        duration: `${duration}ms`,
        avgTime: `${m.avgTime.toFixed(2)}ms`
      });
    }
  }

  /**
   * Record search latency
   * @param {number} duration - Time in milliseconds
   * @param {Object} metadata - Search metadata (query, results count, etc.)
   */
  recordSearch(duration, metadata = {}) {
    const m = this.metrics.searches;
    m.count++;
    m.totalTime += duration;
    m.avgTime = m.totalTime / m.count;
    m.minTime = Math.min(m.minTime, duration);
    m.maxTime = Math.max(m.maxTime, duration);

    // Keep last 100 measurements
    m.history.push({
      timestamp: Date.now(),
      duration,
      ...metadata
    });
    if (m.history.length > 100) {
      m.history.shift();
    }

    // Log slow searches
    if (duration > 2000) {
      logger.warn('Slow search operation', {
        duration: `${duration}ms`,
        avgTime: `${m.avgTime.toFixed(2)}ms`,
        ...metadata
      });
    }
  }

  /**
   * Record generic operation
   * @param {string} operationName - Operation identifier
   * @param {number} duration - Time in milliseconds
   * @param {Object} metadata - Additional metadata
   */
  recordOperation(operationName, duration, metadata = {}) {
    if (!this.metrics.operations[operationName]) {
      this.metrics.operations[operationName] = {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0,
        history: []
      };
    }

    const m = this.metrics.operations[operationName];
    m.count++;
    m.totalTime += duration;
    m.avgTime = m.totalTime / m.count;
    m.minTime = Math.min(m.minTime, duration);
    m.maxTime = Math.max(m.maxTime, duration);

    m.history.push({
      timestamp: Date.now(),
      duration,
      ...metadata
    });
    if (m.history.length > 100) {
      m.history.shift();
    }

    logger.debug(`Operation: ${operationName}`, {
      duration: `${duration}ms`,
      avgTime: `${m.avgTime.toFixed(2)}ms`,
      ...metadata
    });
  }

  /**
   * Update database size metric
   * @param {number} size - Number of vectors
   */
  updateDatabaseSize(size) {
    this.metrics.database.size = size;
    this.metrics.database.lastUpdated = Date.now();

    logger.info('Database size updated', {
      vectors: size,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get all metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    return {
      embeddings: {
        count: this.metrics.embeddings.count,
        avgTime: this.metrics.embeddings.avgTime.toFixed(2),
        minTime: this.metrics.embeddings.minTime === Infinity ? 0 : this.metrics.embeddings.minTime,
        maxTime: this.metrics.embeddings.maxTime
      },
      searches: {
        count: this.metrics.searches.count,
        avgTime: this.metrics.searches.avgTime.toFixed(2),
        minTime: this.metrics.searches.minTime === Infinity ? 0 : this.metrics.searches.minTime,
        maxTime: this.metrics.searches.maxTime
      },
      database: {
        size: this.metrics.database.size,
        lastUpdated: this.metrics.database.lastUpdated
      },
      operations: Object.fromEntries(
        Object.entries(this.metrics.operations).map(([name, m]) => [
          name,
          {
            count: m.count,
            avgTime: m.avgTime.toFixed(2),
            minTime: m.minTime === Infinity ? 0 : m.minTime,
            maxTime: m.maxTime
          }
        ])
      )
    };
  }

  /**
   * Get recent performance trends (last 10 measurements)
   * @param {string} type - 'embeddings' or 'searches'
   * @returns {Array} Recent measurements
   */
  getRecentTrends(type) {
    const metrics = this.metrics[type];
    if (!metrics || !metrics.history) return [];

    return metrics.history.slice(-10).map(m => ({
      timestamp: m.timestamp,
      duration: m.duration,
      date: new Date(m.timestamp).toISOString()
    }));
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      embeddings: {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0,
        history: []
      },
      searches: {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0,
        history: []
      },
      database: {
        size: 0,
        lastUpdated: null
      },
      operations: {}
    };

    logger.info('Performance metrics reset');
  }

  /**
   * Get performance summary report
   * @returns {string} Human-readable summary
   */
  getSummary() {
    const m = this.getMetrics();

    const lines = [
      '=== Performance Metrics Summary ===',
      '',
      `Embeddings: ${m.embeddings.count} total`,
      `  Avg: ${m.embeddings.avgTime}ms | Min: ${m.embeddings.minTime}ms | Max: ${m.embeddings.maxTime}ms`,
      '',
      `Searches: ${m.searches.count} total`,
      `  Avg: ${m.searches.avgTime}ms | Min: ${m.searches.minTime}ms | Max: ${m.searches.maxTime}ms`,
      '',
      `Database: ${m.database.size} vectors`,
      `  Last updated: ${m.database.lastUpdated ? new Date(m.database.lastUpdated).toISOString() : 'Never'}`,
      ''
    ];

    if (Object.keys(m.operations).length > 0) {
      lines.push('Operations:');
      for (const [name, stats] of Object.entries(m.operations)) {
        lines.push(`  ${name}: ${stats.count} calls, avg ${stats.avgTime}ms`);
      }
    }

    return lines.join('\n');
  }
}

/**
 * Performance timer utility
 */
export class PerformanceTimer {
  constructor(name) {
    this.name = name;
    this.startTime = Date.now();
  }

  /**
   * Stop timer and return duration
   * @returns {number} Duration in milliseconds
   */
  stop() {
    return Date.now() - this.startTime;
  }

  /**
   * Stop timer and record to metrics
   * @param {string} type - 'embedding', 'search', or operation name
   * @param {Object} metadata - Additional metadata
   * @returns {number} Duration in milliseconds
   */
  record(type, metadata = {}) {
    const duration = this.stop();

    if (type === 'embedding') {
      performanceMetrics.recordEmbedding(duration);
    } else if (type === 'search') {
      performanceMetrics.recordSearch(duration, metadata);
    } else {
      performanceMetrics.recordOperation(type, duration, metadata);
    }

    return duration;
  }
}

/**
 * Global metrics instance
 */
export const performanceMetrics = new PerformanceMetrics();

/**
 * Helper to time an async operation
 * @param {string} name - Operation name
 * @param {Function} fn - Async function to time
 * @returns {Promise<any>} Result of the function
 */
export async function timeOperation(name, fn) {
  const timer = new PerformanceTimer(name);
  try {
    const result = await fn();
    timer.record(name);
    return result;
  } catch (error) {
    const duration = timer.stop();
    logger.error(`Operation ${name} failed after ${duration}ms`, {
      error: error.message,
      duration: `${duration}ms`
    });
    throw error;
  }
}

export default performanceMetrics;
