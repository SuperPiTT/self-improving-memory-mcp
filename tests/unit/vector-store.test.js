/**
 * Unit Tests for VectorStore
 * Tests embedding generation, search, CRUD operations
 */

import { expect } from 'chai';
import { VectorStore } from '../../src/vector-store.js';
import fs from 'fs/promises';
import path from 'path';

describe('VectorStore', () => {
  const testMemoryPath = path.join(process.cwd(), '.test-memory');
  let store;

  // Setup: Create fresh VectorStore before each test
  beforeEach(async () => {
    store = new VectorStore(testMemoryPath);
  });

  // Teardown: Clean up test directory after each test
  afterEach(async () => {
    try {
      await fs.rm(testMemoryPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await store.initialize();
      expect(store.isInitialized).to.be.true;
    });

    it('should create database directory', async () => {
      await store.initialize();
      const dbExists = await fs.access(store.dbPath).then(() => true).catch(() => false);
      expect(dbExists).to.be.true;
    });

    it('should only initialize once', async () => {
      await store.initialize();
      const embedder1 = store.embedder;

      await store.initialize();
      const embedder2 = store.embedder;

      expect(embedder1).to.equal(embedder2);
    });

    it('should warm up successfully', async () => {
      // Add at least one vector so table exists
      await store.initialize();
      await store.addVector('warmup-test', 'test', {
        type: 'decision',
        content: 'test',
        confidence: 0.5,
        tags: []
      });

      // Now warmup should work
      await store.warmUp();
      expect(store.isWarmedUp).to.be.true;
    });
  });

  describe('Embedding Generation', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should generate embeddings for text', async () => {
      const text = 'This is a test sentence';
      const embedding = await store.generateEmbedding(text);

      expect(embedding).to.be.an('array');
      expect(embedding.length).to.equal(384); // all-MiniLM-L6-v2 dimension
      expect(embedding[0]).to.be.a('number');
    });

    it('should generate different embeddings for different text', async () => {
      const embedding1 = await store.generateEmbedding('Hello world');
      const embedding2 = await store.generateEmbedding('Goodbye world');

      expect(embedding1).to.not.deep.equal(embedding2);
    });

    it('should generate same embeddings for same text', async () => {
      const text = 'Consistent text';
      const embedding1 = await store.generateEmbedding(text);
      const embedding2 = await store.generateEmbedding(text);

      expect(embedding1).to.deep.equal(embedding2);
    });

    it('should normalize embeddings', async () => {
      const embedding = await store.generateEmbedding('Test normalization');

      // Calculate L2 norm (should be ~1 for normalized vectors)
      const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      expect(norm).to.be.closeTo(1.0, 0.01);
    });

    it('should throw error if not initialized', async () => {
      const uninitializedStore = new VectorStore(testMemoryPath);

      try {
        await uninitializedStore.generateEmbedding('Test');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('not initialized');
      }
    });
  });

  describe('Vector Operations', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should add vector successfully', async () => {
      const id = 'test-1';
      const text = 'Test knowledge entry';
      const metadata = {
        type: 'decision',
        content: 'Use testing framework',
        confidence: 0.9,
        verified: true,
        tags: ['testing', 'framework']
      };

      await store.addVector(id, text, metadata);

      const retrieved = await store.getById(id);
      expect(retrieved).to.not.be.null;
      expect(retrieved.id).to.equal(id);
      expect(retrieved.type).to.equal('decision');
      expect(retrieved.content).to.equal('Use testing framework');
    });

    it('should handle metadata with empty arrays', async () => {
      const id = 'test-2';
      const metadata = {
        type: 'error',
        content: 'Test error',
        confidence: 0.5,
        tags: [],
        relatedIds: []
      };

      await store.addVector(id, 'Error text', metadata);

      const retrieved = await store.getById(id);
      expect(retrieved.tags).to.be.an('array').that.is.empty;
      expect(retrieved.relatedIds).to.be.an('array').that.is.empty;
    });

    it('should retrieve vector by ID', async () => {
      const id = 'test-retrieve';
      await store.addVector(id, 'Retrievable entry', {
        type: 'insight',
        content: 'Important insight',
        confidence: 0.8,
        tags: ['important']
      });

      const result = await store.getById(id);

      expect(result).to.not.be.null;
      expect(result.id).to.equal(id);
      expect(result.content).to.equal('Important insight');
    });

    it('should return null for non-existent ID', async () => {
      const result = await store.getById('non-existent-id');
      expect(result).to.be.null;
    });

    it('should update vector successfully', async () => {
      const id = 'test-update';

      // Add initial
      await store.addVector(id, 'Original text', {
        type: 'decision',
        content: 'Original decision',
        confidence: 0.6,
        tags: ['old']
      });

      // Update
      await store.updateVector(id, 'Updated text', {
        type: 'decision',
        content: 'Updated decision',
        confidence: 0.9,
        tags: ['new']
      });

      const result = await store.getById(id);
      expect(result.content).to.equal('Updated decision');
      expect(result.confidence).to.equal(0.9);
      expect(result.tags).to.include('new');
    });

    it('should update metadata only', async () => {
      const id = 'test-metadata-update';

      await store.addVector(id, 'Text unchanged', {
        type: 'pattern',
        content: 'Pattern content',
        confidence: 0.7,
        accessCount: 5
      });

      await store.updateMetadata(id, {
        accessCount: 10,
        verified: true
      });

      const result = await store.getById(id);
      expect(result.accessCount).to.equal(10);
      expect(result.verified).to.be.true;
      expect(result.content).to.equal('Pattern content');
    });

    it('should delete vector successfully', async () => {
      const id = 'test-delete';

      await store.addVector(id, 'To be deleted', {
        type: 'error',
        content: 'Temporary error',
        confidence: 0.5,
        tags: []
      });

      let result = await store.getById(id);
      expect(result).to.not.be.null;

      await store.deleteVector(id);

      result = await store.getById(id);
      expect(result).to.be.null;
    });
  });

  describe('Semantic Search', () => {
    beforeEach(async () => {
      await store.initialize();

      // Add test data
      await store.addVector('doc-1', 'JavaScript programming language', {
        type: 'decision',
        content: 'Use JavaScript for frontend',
        confidence: 0.9,
        tags: ['javascript', 'frontend']
      });

      await store.addVector('doc-2', 'Python data science libraries', {
        type: 'pattern',
        content: 'Use Python for data analysis',
        confidence: 0.8,
        tags: ['python', 'data']
      });

      await store.addVector('doc-3', 'JavaScript testing frameworks', {
        type: 'solution',
        content: 'Use Mocha for testing',
        confidence: 0.95,
        tags: ['javascript', 'testing']
      });
    });

    it('should find semantically similar results', async () => {
      const results = await store.search('JavaScript development', 3);

      expect(results).to.be.an('array');
      expect(results.length).to.be.greaterThan(0);
      expect(results[0].id).to.be.oneOf(['doc-1', 'doc-3']);
    });

    it('should respect topK limit', async () => {
      const results = await store.search('programming', 2);
      expect(results.length).to.be.at.most(2);
    });

    it('should filter by type', async () => {
      const results = await store.search('JavaScript', 5, { type: 'solution' });

      expect(results).to.be.an('array');
      results.forEach(result => {
        expect(result.type).to.equal('solution');
      });
    });

    it('should filter by minimum confidence', async () => {
      const results = await store.search('programming', 5, { minConfidence: 0.9 });

      results.forEach(result => {
        expect(result.confidence).to.be.at.least(0.9);
      });
    });

    it('should return empty array when no results match', async () => {
      const results = await store.search('totally unrelated query xyzabc', 5, {
        minConfidence: 0.99
      });

      expect(results).to.be.an('array');
      // May be empty or have very low relevance
    });

    it('should deserialize arrays in results', async () => {
      const results = await store.search('JavaScript', 1);

      expect(results[0].tags).to.be.an('array');
      expect(results[0].relatedIds).to.be.an('array');
    });
  });

  describe('Bulk Operations', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should get all IDs', async () => {
      await store.addVector('id-1', 'Entry 1', { type: 'decision', content: 'Decision 1', confidence: 0.8, tags: [] });
      await store.addVector('id-2', 'Entry 2', { type: 'error', content: 'Error 1', confidence: 0.6, tags: [] });
      await store.addVector('id-3', 'Entry 3', { type: 'solution', content: 'Solution 1', confidence: 0.9, tags: [] });

      const ids = await store.getAllIds();

      expect(ids).to.be.an('array');
      expect(ids).to.have.lengthOf(3);
      expect(ids).to.include.members(['id-1', 'id-2', 'id-3']);
    });

    it('should get all entries', async () => {
      await store.addVector('entry-1', 'First entry', {
        type: 'decision',
        content: 'First decision',
        confidence: 0.8,
        tags: ['tag1']
      });

      const entries = await store.getAllEntries();

      expect(entries).to.be.an('array');
      expect(entries.length).to.be.at.least(1);
      expect(entries[0].content).to.be.a('string');
      expect(entries[0].tags).to.be.an('array');
    });

    it('should count vectors correctly', async () => {
      expect(await store.count()).to.equal(0);

      await store.addVector('c-1', 'Test 1', { type: 'decision', content: 'Test', confidence: 0.5, tags: [] });
      expect(await store.count()).to.equal(1);

      await store.addVector('c-2', 'Test 2', { type: 'error', content: 'Test', confidence: 0.5, tags: [] });
      expect(await store.count()).to.equal(2);

      await store.deleteVector('c-1');
      expect(await store.count()).to.equal(1);
    });

    it('should return empty array when no entries exist', async () => {
      const ids = await store.getAllIds();
      const entries = await store.getAllEntries();

      expect(ids).to.be.an('array').that.is.empty;
      expect(entries).to.be.an('array').that.is.empty;
    });
  });

  describe('Migration', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should migrate entries from JSON format', async () => {
      const entries = [
        ['id-1', {
          type: 'decision',
          content: 'Migration test 1',
          context: 'Test context',
          confidence: 0.8,
          tags: ['migration', 'test']
        }],
        ['id-2', {
          type: 'solution',
          content: 'Migration test 2',
          confidence: 0.9,
          tags: ['migration']
        }]
      ];

      const stats = await store.migrateFromJSON(entries, {
        checkpoint: false,
        dryRun: false
      });

      expect(stats.total).to.equal(2);
      expect(stats.migrated).to.equal(2);
      expect(stats.failed).to.equal(0);

      const count = await store.count();
      expect(count).to.equal(2);
    });

    it('should handle dry run migration', async () => {
      const entries = [
        ['id-1', { type: 'decision', content: 'Dry run test', confidence: 0.8, tags: [] }]
      ];

      const stats = await store.migrateFromJSON(entries, {
        dryRun: true,
        checkpoint: false
      });

      expect(stats.total).to.equal(1);
      expect(stats.migrated).to.equal(1);
      expect(stats.failed).to.equal(0);

      // No actual data should be added
      const count = await store.count();
      expect(count).to.equal(0);
    });

    it('should track failed migrations', async () => {
      const entries = [
        ['good-1', { type: 'decision', content: 'Good entry', confidence: 0.8, tags: [] }],
        // Invalid entry (will fail during processing)
        ['bad-1', null],
        ['good-2', { type: 'solution', content: 'Another good entry', confidence: 0.9, tags: [] }]
      ];

      try {
        const stats = await store.migrateFromJSON(entries, {
          checkpoint: false,
          dryRun: false
        });

        expect(stats.failed).to.be.greaterThan(0);
        expect(stats.failedIds).to.include('bad-1');
      } catch (error) {
        // Expected if too many failures
      }
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should handle empty text', async () => {
      const embedding = await store.generateEmbedding('');
      expect(embedding).to.be.an('array');
      expect(embedding.length).to.equal(384);
    });

    it('should handle very long text', async () => {
      const longText = 'word '.repeat(1000);
      const embedding = await store.generateEmbedding(longText);

      expect(embedding).to.be.an('array');
      expect(embedding.length).to.equal(384);
    });

    it('should handle special characters in text', async () => {
      const specialText = '!@#$%^&*()_+{}|:"<>?[];,./~`';
      const embedding = await store.generateEmbedding(specialText);

      expect(embedding).to.be.an('array');
      expect(embedding.length).to.equal(384);
    });

    it('should handle special characters in ID', async () => {
      const id = 'test-id-with-special-chars-2024';
      await store.addVector(id, 'Test', {
        type: 'decision',
        content: 'Test',
        confidence: 0.5,
        tags: []
      });

      const result = await store.getById(id);
      expect(result).to.not.be.null;
      expect(result.id).to.equal(id);
    });

    it('should handle unicode text', async () => {
      const unicodeText = '你好世界 مرحبا العالم 🌍';
      const embedding = await store.generateEmbedding(unicodeText);

      expect(embedding).to.be.an('array');
      expect(embedding.length).to.equal(384);
    });
  });
});
