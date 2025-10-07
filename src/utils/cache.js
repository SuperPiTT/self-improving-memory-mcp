/**
 * LRU Cache for Embeddings
 * Reduces redundant embedding generation by caching frequently used embeddings
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export class LRUCache {
  constructor(maxSize = 1000, persistPath = null) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.persistPath = persistPath;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Generate cache key from text
   */
  _generateKey(text) {
    return crypto.createHash('md5').update(text.toLowerCase().trim()).digest('hex');
  }

  /**
   * Get value from cache
   */
  get(text) {
    const key = this._generateKey(text);

    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
      this.hits++;
      return value;
    }

    this.misses++;
    return null;
  }

  /**
   * Set value in cache
   */
  set(text, embedding) {
    const key = this._generateKey(text);

    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      text,
      embedding,
      timestamp: Date.now()
    });
  }

  /**
   * Check if cache has entry
   */
  has(text) {
    return this.cache.has(this._generateKey(text));
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  stats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        text: value.text.substring(0, 50),
        timestamp: value.timestamp
      }))
    };
  }

  /**
   * Persist cache to disk
   */
  async persist() {
    if (!this.persistPath) return;

    const data = {
      maxSize: this.maxSize,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        text: value.text,
        embedding: value.embedding,
        timestamp: value.timestamp
      }))
    };

    await fs.mkdir(path.dirname(this.persistPath), { recursive: true });
    await fs.writeFile(this.persistPath, JSON.stringify(data, null, 2));
  }

  /**
   * Load cache from disk
   */
  async load() {
    if (!this.persistPath) return;

    try {
      const fileContent = await fs.readFile(this.persistPath, 'utf-8');
      const data = JSON.parse(fileContent);

      this.maxSize = data.maxSize || this.maxSize;
      this.cache.clear();

      // Restore entries (keep only most recent up to maxSize)
      const sortedEntries = data.entries
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.maxSize);

      sortedEntries.forEach(({ key, text, embedding, timestamp }) => {
        this.cache.set(key, { text, embedding, timestamp });
      });
    } catch (error) {
      // File doesn't exist or is invalid, start fresh
      console.error('Cache load failed (starting fresh):', error.message);
    }
  }
}

/**
 * Batch Processor for Embeddings
 * Processes multiple texts in a single batch to reduce overhead
 */
export class BatchProcessor {
  constructor(batchSize = 10, maxWaitMs = 100) {
    this.batchSize = batchSize;
    this.maxWaitMs = maxWaitMs;
    this.queue = [];
    this.timer = null;
  }

  /**
   * Add text to batch queue
   */
  add(text, resolver) {
    this.queue.push({ text, resolver });

    if (this.queue.length >= this.batchSize) {
      this._processBatch();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this._processBatch(), this.maxWaitMs);
    }
  }

  /**
   * Process batch
   */
  async _processBatch() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.batchSize);

    // Process all texts in batch (to be implemented by caller)
    return batch;
  }

  /**
   * Get batch from queue without processing
   */
  getBatch() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const batch = this.queue.splice(0, this.batchSize);
    return batch;
  }

  /**
   * Clear queue
   */
  clear() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.queue = [];
  }

  /**
   * Get queue size
   */
  size() {
    return this.queue.length;
  }
}

/**
 * Embedding Quantizer
 * Reduces embedding size by quantizing float32 to int8
 */
export class EmbeddingQuantizer {
  /**
   * Quantize embedding from float32 to int8
   * @param {Array<number>} embedding - Float32 embedding
   * @returns {Object} Quantized embedding with scale and offset
   */
  static quantize(embedding) {
    if (!embedding || embedding.length === 0) {
      return { quantized: [], scale: 1, offset: 0 };
    }

    const min = Math.min(...embedding);
    const max = Math.max(...embedding);
    const scale = (max - min) / 255;
    const offset = min;

    const quantized = embedding.map(val => {
      const normalized = (val - offset) / scale;
      return Math.round(Math.max(0, Math.min(255, normalized)));
    });

    return {
      quantized: Buffer.from(quantized),
      scale,
      offset,
      originalSize: embedding.length * 4, // float32 = 4 bytes
      quantizedSize: quantized.length // int8 = 1 byte
    };
  }

  /**
   * Dequantize embedding from int8 to float32
   * @param {Buffer} quantized - Quantized embedding
   * @param {number} scale - Scale factor
   * @param {number} offset - Offset value
   * @returns {Array<number>} Float32 embedding
   */
  static dequantize(quantized, scale, offset) {
    if (!quantized || quantized.length === 0) {
      return [];
    }

    const buffer = Buffer.isBuffer(quantized) ? quantized : Buffer.from(quantized);
    const embedding = [];

    for (let i = 0; i < buffer.length; i++) {
      const val = buffer[i] * scale + offset;
      embedding.push(val);
    }

    return embedding;
  }

  /**
   * Calculate compression ratio
   */
  static getCompressionRatio(embedding) {
    const quantized = this.quantize(embedding);
    return quantized.originalSize / quantized.quantizedSize;
  }
}

/**
 * Connection Pool for Database Operations
 * Manages multiple concurrent database connections
 */
export class ConnectionPool {
  constructor(maxConnections = 5) {
    this.maxConnections = maxConnections;
    this.available = [];
    this.inUse = new Set();
    this.waiting = [];
    this.totalCreated = 0;
  }

  /**
   * Acquire connection from pool
   */
  async acquire() {
    // Return available connection if exists
    if (this.available.length > 0) {
      const conn = this.available.pop();
      this.inUse.add(conn);
      return conn;
    }

    // Create new connection if under limit
    if (this.totalCreated < this.maxConnections) {
      const conn = { id: ++this.totalCreated, createdAt: Date.now() };
      this.inUse.add(conn);
      return conn;
    }

    // Wait for available connection
    return new Promise((resolve) => {
      this.waiting.push(resolve);
    });
  }

  /**
   * Release connection back to pool
   */
  release(conn) {
    this.inUse.delete(conn);

    // Give to waiting request if any
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift();
      this.inUse.add(conn);
      resolve(conn);
    } else {
      this.available.push(conn);
    }
  }

  /**
   * Execute with connection
   */
  async execute(fn) {
    const conn = await this.acquire();
    try {
      return await fn(conn);
    } finally {
      this.release(conn);
    }
  }

  /**
   * Get pool statistics
   */
  stats() {
    return {
      total: this.totalCreated,
      available: this.available.length,
      inUse: this.inUse.size,
      waiting: this.waiting.length,
      maxConnections: this.maxConnections
    };
  }

  /**
   * Close all connections
   */
  close() {
    this.available = [];
    this.inUse.clear();
    this.waiting.forEach(resolve => resolve(null));
    this.waiting = [];
  }
}
