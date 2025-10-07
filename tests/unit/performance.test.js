import { expect } from 'chai';
import {
  PerformanceTimer,
  performanceMetrics,
  timeOperation
} from '../../src/utils/performance.js';

describe('Performance Monitoring', () => {
  beforeEach(() => {
    // Reset metrics before each test
    performanceMetrics.reset();
  });

  describe('PerformanceTimer', () => {
    it('should measure elapsed time', async () => {
      const timer = new PerformanceTimer('test-operation');

      // Wait 50ms
      await new Promise(resolve => setTimeout(resolve, 50));

      const duration = timer.stop();

      expect(duration).to.be.at.least(45); // Allow some variance
      expect(duration).to.be.at.most(100);
    });

    it('should record embedding metrics', () => {
      const timer = new PerformanceTimer('test-embedding');
      timer.record('embedding');

      const metrics = performanceMetrics.getMetrics();

      expect(metrics.embeddings.count).to.equal(1);
      expect(parseFloat(metrics.embeddings.avgTime)).to.be.at.least(0);
    });

    it('should record search metrics', () => {
      const timer = new PerformanceTimer('test-search');
      timer.record('search', { query: 'test query', resultsCount: 5 });

      const metrics = performanceMetrics.getMetrics();

      expect(metrics.searches.count).to.equal(1);
      expect(parseFloat(metrics.searches.avgTime)).to.be.at.least(0);
    });

    it('should record custom operation metrics', () => {
      const timer = new PerformanceTimer('custom-op');
      timer.record('database-write', { recordCount: 10 });

      const metrics = performanceMetrics.getMetrics();

      expect(metrics.operations['database-write']).to.exist;
      expect(metrics.operations['database-write'].count).to.equal(1);
    });
  });

  describe('PerformanceMetrics', () => {
    it('should track multiple embeddings', () => {
      performanceMetrics.recordEmbedding(100);
      performanceMetrics.recordEmbedding(200);
      performanceMetrics.recordEmbedding(150);

      const metrics = performanceMetrics.getMetrics();

      expect(metrics.embeddings.count).to.equal(3);
      expect(parseFloat(metrics.embeddings.avgTime)).to.equal(150);
      expect(metrics.embeddings.minTime).to.equal(100);
      expect(metrics.embeddings.maxTime).to.equal(200);
    });

    it('should track multiple searches', () => {
      performanceMetrics.recordSearch(50, { query: 'test1' });
      performanceMetrics.recordSearch(100, { query: 'test2' });
      performanceMetrics.recordSearch(75, { query: 'test3' });

      const metrics = performanceMetrics.getMetrics();

      expect(metrics.searches.count).to.equal(3);
      expect(parseFloat(metrics.searches.avgTime)).to.equal(75);
      expect(metrics.searches.minTime).to.equal(50);
      expect(metrics.searches.maxTime).to.equal(100);
    });

    it('should track custom operations', () => {
      performanceMetrics.recordOperation('addVector', 25);
      performanceMetrics.recordOperation('addVector', 35);
      performanceMetrics.recordOperation('deleteVector', 10);

      const metrics = performanceMetrics.getMetrics();

      expect(metrics.operations.addVector.count).to.equal(2);
      expect(parseFloat(metrics.operations.addVector.avgTime)).to.equal(30);
      expect(metrics.operations.deleteVector.count).to.equal(1);
    });

    it('should update database size', () => {
      performanceMetrics.updateDatabaseSize(100);

      const metrics = performanceMetrics.getMetrics();

      expect(metrics.database.size).to.equal(100);
      expect(metrics.database.lastUpdated).to.be.a('number');
    });

    it('should maintain history limited to 100 entries', () => {
      // Record 150 embeddings
      for (let i = 0; i < 150; i++) {
        performanceMetrics.recordEmbedding(100);
      }

      expect(performanceMetrics.metrics.embeddings.history.length).to.equal(100);
      expect(performanceMetrics.metrics.embeddings.count).to.equal(150);
    });

    it('should calculate correct averages over time', () => {
      performanceMetrics.recordEmbedding(100);
      performanceMetrics.recordEmbedding(200);
      performanceMetrics.recordEmbedding(300);

      const metrics = performanceMetrics.getMetrics();

      expect(parseFloat(metrics.embeddings.avgTime)).to.equal(200);
    });

    it('should reset all metrics', () => {
      performanceMetrics.recordEmbedding(100);
      performanceMetrics.recordSearch(50);
      performanceMetrics.updateDatabaseSize(10);

      performanceMetrics.reset();

      const metrics = performanceMetrics.getMetrics();

      expect(metrics.embeddings.count).to.equal(0);
      expect(metrics.searches.count).to.equal(0);
      expect(metrics.database.size).to.equal(0);
    });

    it('should get recent trends', () => {
      for (let i = 0; i < 15; i++) {
        performanceMetrics.recordEmbedding(100 + i);
      }

      const trends = performanceMetrics.getRecentTrends('embeddings');

      expect(trends).to.have.length(10);
      expect(trends[0].duration).to.equal(105); // Last 10 start from 5th
    });

    it('should generate summary report', () => {
      performanceMetrics.recordEmbedding(100);
      performanceMetrics.recordSearch(50);
      performanceMetrics.updateDatabaseSize(42);

      const summary = performanceMetrics.getSummary();

      expect(summary).to.be.a('string');
      expect(summary).to.include('Performance Metrics Summary');
      expect(summary).to.include('Embeddings: 1 total');
      expect(summary).to.include('Searches: 1 total');
      expect(summary).to.include('Database: 42 vectors');
    });
  });

  describe('timeOperation helper', () => {
    it('should time an async operation', async () => {
      const result = await timeOperation('test-op', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'done';
      });

      expect(result).to.equal('done');

      const metrics = performanceMetrics.getMetrics();
      expect(metrics.operations['test-op']).to.exist;
      expect(metrics.operations['test-op'].count).to.equal(1);
    });

    it('should handle operation errors', async () => {
      try {
        await timeOperation('failing-op', async () => {
          throw new Error('Test error');
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Test error');
      }
    });

    it('should return operation result', async () => {
      const result = await timeOperation('data-op', async () => {
        return { data: [1, 2, 3] };
      });

      expect(result).to.deep.equal({ data: [1, 2, 3] });
    });
  });

  describe('Performance edge cases', () => {
    it('should handle zero duration', () => {
      performanceMetrics.recordEmbedding(0);

      const metrics = performanceMetrics.getMetrics();

      expect(metrics.embeddings.minTime).to.equal(0);
      expect(parseFloat(metrics.embeddings.avgTime)).to.equal(0);
    });

    it('should handle very large durations', () => {
      performanceMetrics.recordSearch(999999);

      const metrics = performanceMetrics.getMetrics();

      expect(metrics.searches.maxTime).to.equal(999999);
    });

    it('should handle empty history on trends', () => {
      const trends = performanceMetrics.getRecentTrends('searches');

      expect(trends).to.be.an('array');
      expect(trends).to.have.length(0);
    });

    it('should initialize metrics with Infinity minTime', () => {
      const metrics = performanceMetrics.getMetrics();

      // minTime should be 0 when no operations recorded (cleaned up)
      expect(metrics.embeddings.minTime).to.equal(0);
      expect(metrics.searches.minTime).to.equal(0);
    });
  });

  describe('Integration scenarios', () => {
    it('should track complete workflow metrics', async () => {
      // Simulate a complete operation workflow
      performanceMetrics.recordEmbedding(120);
      performanceMetrics.recordSearch(80, { query: 'test', resultsCount: 5 });
      performanceMetrics.recordOperation('addVector', 30);
      performanceMetrics.updateDatabaseSize(10);

      const metrics = performanceMetrics.getMetrics();

      expect(metrics.embeddings.count).to.equal(1);
      expect(metrics.searches.count).to.equal(1);
      expect(metrics.operations.addVector.count).to.equal(1);
      expect(metrics.database.size).to.equal(10);

      const summary = performanceMetrics.getSummary();
      expect(summary).to.include('Embeddings: 1 total');
      expect(summary).to.include('Searches: 1 total');
      expect(summary).to.include('Database: 10 vectors');
    });
  });
});
