import { expect } from 'chai';
import {
  LRUCache,
  BatchProcessor,
  EmbeddingQuantizer,
  ConnectionPool
} from '../../src/utils/cache.js';

describe('Performance Optimization', () => {
  describe('LRUCache', () => {
    let cache;

    beforeEach(() => {
      cache = new LRUCache(3); // Small cache for testing
    });

    it('should cache and retrieve values', () => {
      cache.set('hello', [1, 2, 3]);
      const result = cache.get('hello');

      expect(result).to.exist;
      expect(result.embedding).to.deep.equal([1, 2, 3]);
    });

    it('should be case-insensitive and trim whitespace', () => {
      cache.set('  Hello World  ', [1, 2, 3]);
      const result = cache.get('hello world');

      expect(result).to.exist;
      expect(result.embedding).to.deep.equal([1, 2, 3]);
    });

    it('should track cache hits and misses', () => {
      cache.set('test', [1, 2, 3]);

      cache.get('test'); // hit
      cache.get('test'); // hit
      cache.get('missing'); // miss

      const stats = cache.stats();
      expect(stats.hits).to.equal(2);
      expect(stats.misses).to.equal(1);
      expect(stats.hitRate).to.be.closeTo(0.666, 0.01);
    });

    it('should enforce max size (LRU eviction)', () => {
      cache.set('a', [1]);
      cache.set('b', [2]);
      cache.set('c', [3]);
      cache.set('d', [4]); // Should evict 'a'

      expect(cache.get('a')).to.be.null; // Evicted
      expect(cache.get('b')).to.exist;
      expect(cache.get('c')).to.exist;
      expect(cache.get('d')).to.exist;
    });

    it('should move accessed items to end (LRU)', () => {
      cache.set('a', [1]);
      cache.set('b', [2]);
      cache.set('c', [3]);

      cache.get('a'); // Access 'a', moves to end

      cache.set('d', [4]); // Should evict 'b', not 'a'

      expect(cache.get('a')).to.exist; // Still exists
      expect(cache.get('b')).to.be.null; // Evicted
      expect(cache.get('c')).to.exist;
      expect(cache.get('d')).to.exist;
    });

    it('should check if cache has entry', () => {
      cache.set('test', [1, 2, 3]);

      expect(cache.has('test')).to.be.true;
      expect(cache.has('missing')).to.be.false;
    });

    it('should clear cache', () => {
      cache.set('a', [1]);
      cache.set('b', [2]);

      cache.clear();

      expect(cache.size()).to.equal(0);
      expect(cache.stats().hits).to.equal(0);
      expect(cache.stats().misses).to.equal(0);
    });

    it('should return correct size', () => {
      expect(cache.size()).to.equal(0);

      cache.set('a', [1]);
      expect(cache.size()).to.equal(1);

      cache.set('b', [2]);
      cache.set('c', [3]);
      expect(cache.size()).to.equal(3);

      cache.set('d', [4]); // Evict one
      expect(cache.size()).to.equal(3); // Still max size
    });
  });

  describe('BatchProcessor', () => {
    let processor;

    beforeEach(() => {
      processor = new BatchProcessor(3, 50); // Small batch, quick timeout
    });

    afterEach(() => {
      processor.clear();
    });

    it('should queue items', () => {
      processor.add('text1', () => {});
      processor.add('text2', () => {});

      expect(processor.size()).to.equal(2);
    });

    it('should process batch when size reached', () => {
      processor.add('text1', () => {});
      processor.add('text2', () => {});
      processor.add('text3', () => {}); // Batch size reached

      expect(processor.size()).to.equal(0); // Batch processed
    });

    it('should return batch items', () => {
      processor.add('text1', () => {});
      processor.add('text2', () => {});

      const batch = processor.getBatch();

      expect(batch).to.have.length(2);
      expect(batch[0].text).to.equal('text1');
      expect(batch[1].text).to.equal('text2');
    });

    it('should clear queue', () => {
      processor.add('text1', () => {});
      processor.add('text2', () => {});

      processor.clear();

      expect(processor.size()).to.equal(0);
    });

    it('should respect batch size limit', () => {
      processor.add('text1', () => {});
      processor.add('text2', () => {});
      processor.add('text3', () => {});
      processor.add('text4', () => {});
      processor.add('text5', () => {});

      const batch = processor.getBatch();

      expect(batch).to.have.length.at.most(3); // Batch size
    });
  });

  describe('EmbeddingQuantizer', () => {
    it('should quantize float32 to int8', () => {
      const embedding = [0.1, 0.5, 0.9, -0.3];
      const result = EmbeddingQuantizer.quantize(embedding);

      expect(result.quantized).to.be.instanceOf(Buffer);
      expect(result.scale).to.be.a('number');
      expect(result.offset).to.be.a('number');
      expect(result.quantizedSize).to.equal(4);
      expect(result.originalSize).to.equal(16); // 4 * 4 bytes
    });

    it('should dequantize int8 to float32', () => {
      const embedding = [0.1, 0.5, 0.9, -0.3];
      const quantized = EmbeddingQuantizer.quantize(embedding);
      const dequantized = EmbeddingQuantizer.dequantize(
        quantized.quantized,
        quantized.scale,
        quantized.offset
      );

      expect(dequantized).to.have.length(4);
      // Values should be close to original
      dequantized.forEach((val, i) => {
        expect(val).to.be.closeTo(embedding[i], 0.01);
      });
    });

    it('should reduce size by 4x', () => {
      const embedding = new Array(384).fill(0).map(() => Math.random());
      const quantized = EmbeddingQuantizer.quantize(embedding);

      const ratio = quantized.originalSize / quantized.quantizedSize;
      expect(ratio).to.equal(4); // float32 (4 bytes) to int8 (1 byte)
    });

    it('should handle edge cases', () => {
      const allZeros = [0, 0, 0, 0];
      const allOnes = [1, 1, 1, 1];

      const q1 = EmbeddingQuantizer.quantize(allZeros);
      const q2 = EmbeddingQuantizer.quantize(allOnes);

      const d1 = EmbeddingQuantizer.dequantize(q1.quantized, q1.scale, q1.offset);
      const d2 = EmbeddingQuantizer.dequantize(q2.quantized, q2.scale, q2.offset);

      d1.forEach(val => expect(val).to.be.closeTo(0, 0.001));
      d2.forEach(val => expect(val).to.be.closeTo(1, 0.001));
    });

    it('should handle empty embedding', () => {
      const result = EmbeddingQuantizer.quantize([]);

      expect(result.quantized).to.have.length(0);
      expect(result.scale).to.equal(1);
      expect(result.offset).to.equal(0);
    });

    it('should calculate compression ratio', () => {
      const embedding = new Array(100).fill(0.5);
      const ratio = EmbeddingQuantizer.getCompressionRatio(embedding);

      expect(ratio).to.equal(4);
    });

    it('should preserve value range', () => {
      const embedding = [-1, -0.5, 0, 0.5, 1];
      const quantized = EmbeddingQuantizer.quantize(embedding);
      const dequantized = EmbeddingQuantizer.dequantize(
        quantized.quantized,
        quantized.scale,
        quantized.offset
      );

      const originalMin = Math.min(...embedding);
      const originalMax = Math.max(...embedding);
      const dequantizedMin = Math.min(...dequantized);
      const dequantizedMax = Math.max(...dequantized);

      expect(dequantizedMin).to.be.closeTo(originalMin, 0.01);
      expect(dequantizedMax).to.be.closeTo(originalMax, 0.01);
    });
  });

  describe('ConnectionPool', () => {
    let pool;

    beforeEach(() => {
      pool = new ConnectionPool(3);
    });

    afterEach(() => {
      pool.close();
    });

    it('should acquire connection', async () => {
      const conn = await pool.acquire();

      expect(conn).to.exist;
      expect(conn.id).to.equal(1);
    });

    it('should release connection', async () => {
      const conn = await pool.acquire();
      pool.release(conn);

      const stats = pool.stats();
      expect(stats.available).to.equal(1);
      expect(stats.inUse).to.equal(0);
    });

    it('should reuse released connections', async () => {
      const conn1 = await pool.acquire();
      pool.release(conn1);

      const conn2 = await pool.acquire();

      expect(conn2.id).to.equal(conn1.id); // Reused
    });

    it('should create up to max connections', async () => {
      const conn1 = await pool.acquire();
      const conn2 = await pool.acquire();
      const conn3 = await pool.acquire();

      const stats = pool.stats();
      expect(stats.total).to.equal(3);
      expect(stats.inUse).to.equal(3);
    });

    it('should queue requests when at max', async () => {
      const conn1 = await pool.acquire();
      const conn2 = await pool.acquire();
      const conn3 = await pool.acquire();

      // This should wait
      const promise = pool.acquire();

      const stats = pool.stats();
      expect(stats.waiting).to.equal(1);

      // Release one
      pool.release(conn1);

      const conn4 = await promise;
      expect(conn4.id).to.equal(1); // Reused conn1
    });

    it('should execute with connection', async () => {
      let executedWithConn = null;

      await pool.execute(async (conn) => {
        executedWithConn = conn;
        return 'result';
      });

      expect(executedWithConn).to.exist;

      // Connection should be released
      const stats = pool.stats();
      expect(stats.inUse).to.equal(0);
      expect(stats.available).to.equal(1);
    });

    it('should release connection even if fn throws', async () => {
      try {
        await pool.execute(async () => {
          throw new Error('Test error');
        });
      } catch (e) {
        // Expected
      }

      const stats = pool.stats();
      expect(stats.inUse).to.equal(0);
      expect(stats.available).to.equal(1);
    });

    it('should get pool statistics', async () => {
      await pool.acquire();
      await pool.acquire();

      const stats = pool.stats();

      expect(stats).to.have.property('total', 2);
      expect(stats).to.have.property('available', 0);
      expect(stats).to.have.property('inUse', 2);
      expect(stats).to.have.property('waiting', 0);
      expect(stats).to.have.property('maxConnections', 3);
    });

    it('should close all connections', async () => {
      await pool.acquire();
      await pool.acquire();

      pool.close();

      const stats = pool.stats();
      expect(stats.total).to.equal(2); // Created count doesn't reset
      expect(stats.available).to.equal(0);
      expect(stats.inUse).to.equal(0);
      expect(stats.waiting).to.equal(0);
    });
  });

  describe('Integration', () => {
    it('should work together for optimized pipeline', async () => {
      const cache = new LRUCache(10);
      const pool = new ConnectionPool(2);

      // Simulate embedding generation with cache
      const generateEmbedding = async (text) => {
        const cached = cache.get(text);
        if (cached) return cached.embedding;

        const embedding = await pool.execute(async () => {
          // Simulate expensive operation
          return new Array(384).fill(0).map(() => Math.random());
        });

        cache.set(text, embedding);
        return embedding;
      };

      // First call - cache miss
      const emb1 = await generateEmbedding('hello');
      expect(cache.stats().misses).to.equal(1);

      // Second call - cache hit
      const emb2 = await generateEmbedding('hello');
      expect(cache.stats().hits).to.equal(1);
      expect(emb2).to.deep.equal(emb1);

      pool.close();
    });
  });
});
