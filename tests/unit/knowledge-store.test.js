/**
 * Unit Tests for KnowledgeStore
 * Tests knowledge management, linking, stats, and export
 */

import { expect } from 'chai';
import fs from 'fs/promises';
import path from 'path';

// Import KnowledgeStore class from index.js
// Since it's not exported, we'll need to test it via MCP tools or refactor
// For now, we'll create a standalone version for testing

class KnowledgeStore {
  constructor(projectPath) {
    this.memoryPath = path.join(projectPath, '.claude-memory');
    // Import VectorStore dynamically
    this.vectorStore = null;
    this.VectorStore = null;
  }

  async initialize() {
    const { VectorStore } = await import('../../src/vector-store.js');
    this.VectorStore = VectorStore;
    this.vectorStore = new VectorStore(this.memoryPath);

    try {
      await fs.mkdir(this.memoryPath, { recursive: true });
      await this.vectorStore.initialize();
    } catch (error) {
      console.error('Error initializing knowledge store:', error);
    }
  }

  async addEntry(entry) {
    const crypto = await import('crypto');
    const id = crypto.randomUUID();
    const fullEntry = {
      ...entry,
      id,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      relatedIds: [],
    };

    const text = `${entry.content} ${entry.context || ''}`;
    await this.vectorStore.addVector(id, text, fullEntry);

    return id;
  }

  async updateEntry(id, updates) {
    const existing = await this.vectorStore.getById(id);
    if (!existing) throw new Error(`Entry ${id} not found`);

    const updated = { ...existing, ...updates };

    if (updates.content || updates.context) {
      const text = `${updated.content} ${updated.context || ''}`;
      await this.vectorStore.updateVector(id, text, updated);
    } else {
      await this.vectorStore.updateMetadata(id, updated);
    }
  }

  async search(query, filters = {}) {
    const results = await this.vectorStore.search(query, 10, filters);

    for (const result of results) {
      result.lastAccessed = Date.now();
      result.accessCount = (result.accessCount || 0) + 1;

      await this.vectorStore.updateMetadata(result.id, {
        lastAccessed: result.lastAccessed,
        accessCount: result.accessCount,
      });
    }

    return results;
  }

  async getById(id) {
    return await this.vectorStore.getById(id);
  }

  async deleteEntry(id) {
    await this.vectorStore.deleteVector(id);
  }

  async linkEntries(sourceId, targetId, relationship = 'relates_to') {
    const source = await this.vectorStore.getById(sourceId);
    if (!source) throw new Error(`Source entry ${sourceId} not found`);

    if (!source.relatedIds) source.relatedIds = [];

    if (!source.relatedIds.includes(targetId)) {
      source.relatedIds.push(targetId);
      await this.vectorStore.updateMetadata(sourceId, {
        relatedIds: source.relatedIds
      });
    }
  }

  async getStats() {
    const allEntries = await this.vectorStore.getAllEntries();

    return {
      totalEntries: allEntries.length,
      byType: {
        decision: allEntries.filter(e => e.type === 'decision').length,
        error: allEntries.filter(e => e.type === 'error').length,
        solution: allEntries.filter(e => e.type === 'solution').length,
        pattern: allEntries.filter(e => e.type === 'pattern').length,
        insight: allEntries.filter(e => e.type === 'insight').length,
      },
      byConfidence: {
        high: allEntries.filter(e => e.confidence >= 0.8).length,
        medium: allEntries.filter(e => e.confidence >= 0.5 && e.confidence < 0.8).length,
        low: allEntries.filter(e => e.confidence < 0.5).length,
      },
      verified: allEntries.filter(e => e.verified).length,
      mostAccessedId: allEntries.sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0))[0]?.id,
    };
  }

  async exportMarkdown() {
    const entries = await this.vectorStore.getAllEntries();
    const exportPath = path.join(this.memoryPath, 'knowledge-export.md');

    let markdown = `# Project Knowledge Base\n\n`;
    markdown += `Generated: ${new Date().toISOString()}\n\n`;

    const byType = {
      decision: [],
      error: [],
      solution: [],
      pattern: [],
      insight: [],
    };

    entries.forEach(entry => {
      if (byType[entry.type]) {
        byType[entry.type].push(entry);
      }
    });

    for (const [type, typeEntries] of Object.entries(byType)) {
      if (typeEntries.length === 0) continue;

      markdown += `## ${type.charAt(0).toUpperCase() + type.slice(1)}s\n\n`;

      typeEntries
        .sort((a, b) => b.confidence - a.confidence)
        .forEach(entry => {
          markdown += `### ${entry.content}\n\n`;
          if (entry.context) markdown += `**Context:** ${entry.context}\n\n`;
          markdown += `**Confidence:** ${(entry.confidence * 100).toFixed(0)}%\n`;
          markdown += `**Verified:** ${entry.verified ? 'Yes' : 'No'}\n`;
          markdown += `**Tags:** ${entry.tags.join(', ')}\n`;
          markdown += `**Access count:** ${entry.accessCount || 0}\n\n`;
          markdown += `---\n\n`;
        });
    }

    await fs.writeFile(exportPath, markdown);
    return exportPath;
  }
}

describe('KnowledgeStore', () => {
  const testProjectPath = path.join(process.cwd(), '.test-project');
  let store;

  beforeEach(async () => {
    store = new KnowledgeStore(testProjectPath);
    await store.initialize();
  });

  afterEach(async () => {
    try {
      await fs.rm(testProjectPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Entry Management', () => {
    it('should add entry and return ID', async () => {
      const entry = {
        type: 'decision',
        content: 'Use Mocha for testing',
        context: 'Testing framework decision',
        confidence: 0.9,
        verified: true,
        tags: ['testing', 'framework']
      };

      const id = await store.addEntry(entry);

      expect(id).to.be.a('string');
      expect(id).to.have.length.greaterThan(0);
    });

    it('should retrieve entry by ID', async () => {
      const entry = {
        type: 'solution',
        content: 'Fixed the bug',
        confidence: 0.85,
        verified: false,
        tags: ['bugfix']
      };

      const id = await store.addEntry(entry);
      const retrieved = await store.getById(id);

      expect(retrieved).to.not.be.null;
      expect(retrieved.id).to.equal(id);
      expect(retrieved.content).to.equal('Fixed the bug');
      expect(retrieved.confidence).to.equal(0.85);
    });

    it('should update entry', async () => {
      const entry = {
        type: 'error',
        content: 'Original error',
        confidence: 0.6,
        verified: false,
        tags: ['bug']
      };

      const id = await store.addEntry(entry);

      await store.updateEntry(id, {
        confidence: 0.8,
        verified: true
      });

      const updated = await store.getById(id);
      expect(updated.confidence).to.equal(0.8);
      expect(updated.verified).to.be.true;
    });

    it('should update content and re-embed', async () => {
      const entry = {
        type: 'decision',
        content: 'Original decision',
        confidence: 0.7,
        verified: false,
        tags: []
      };

      const id = await store.addEntry(entry);

      await store.updateEntry(id, {
        content: 'Updated decision',
        context: 'New context'
      });

      const updated = await store.getById(id);
      expect(updated.content).to.equal('Updated decision');
      expect(updated.context).to.equal('New context');
    });

    it('should delete entry', async () => {
      const entry = {
        type: 'pattern',
        content: 'Temporary pattern',
        confidence: 0.5,
        verified: false,
        tags: []
      };

      const id = await store.addEntry(entry);

      let retrieved = await store.getById(id);
      expect(retrieved).to.not.be.null;

      await store.deleteEntry(id);

      retrieved = await store.getById(id);
      expect(retrieved).to.be.null;
    });

    it('should throw error when updating non-existent entry', async () => {
      try {
        await store.updateEntry('non-existent-id', { confidence: 0.9 });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('not found');
      }
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      // Add test data
      await store.addEntry({
        type: 'decision',
        content: 'Use React for frontend',
        confidence: 0.9,
        verified: true,
        tags: ['react', 'frontend']
      });

      await store.addEntry({
        type: 'solution',
        content: 'Use Redux for state management',
        confidence: 0.85,
        verified: true,
        tags: ['redux', 'state']
      });

      await store.addEntry({
        type: 'error',
        content: 'React rendering issue',
        confidence: 0.6,
        verified: false,
        tags: ['react', 'bug']
      });
    });

    it('should search by query', async () => {
      const results = await store.search('React frontend');

      expect(results).to.be.an('array');
      expect(results.length).to.be.greaterThan(0);
    });

    it('should filter by type', async () => {
      const results = await store.search('React', { type: 'decision' });

      expect(results).to.be.an('array');
      results.forEach(result => {
        expect(result.type).to.equal('decision');
      });
    });

    it('should filter by minimum confidence', async () => {
      const results = await store.search('React', { minConfidence: 0.8 });

      results.forEach(result => {
        expect(result.confidence).to.be.at.least(0.8);
      });
    });

    it('should increment access count on search', async () => {
      const initialResults = await store.search('React');
      const id = initialResults[0].id;

      const entry = await store.getById(id);
      const initialAccessCount = entry.accessCount;

      await store.search('React');

      const updated = await store.getById(id);
      expect(updated.accessCount).to.be.greaterThan(initialAccessCount);
    });

    it('should update lastAccessed timestamp', async () => {
      const results = await store.search('React');
      const id = results[0].id;

      const entry = await store.getById(id);
      const lastAccessed = entry.lastAccessed;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      await store.search('React');

      const updated = await store.getById(id);
      expect(updated.lastAccessed).to.be.greaterThan(lastAccessed);
    });
  });

  describe('Entry Linking', () => {
    it('should link two entries', async () => {
      const errorId = await store.addEntry({
        type: 'error',
        content: 'Database connection failed',
        confidence: 0.7,
        verified: false,
        tags: ['database']
      });

      const solutionId = await store.addEntry({
        type: 'solution',
        content: 'Increased connection pool size',
        confidence: 0.9,
        verified: true,
        tags: ['database', 'fix']
      });

      await store.linkEntries(errorId, solutionId, 'fixed_by');

      const error = await store.getById(errorId);
      expect(error.relatedIds).to.include(solutionId);
    });

    it('should not duplicate links', async () => {
      const id1 = await store.addEntry({
        type: 'decision',
        content: 'First decision',
        confidence: 0.8,
        verified: false,
        tags: []
      });

      const id2 = await store.addEntry({
        type: 'decision',
        content: 'Second decision',
        confidence: 0.8,
        verified: false,
        tags: []
      });

      await store.linkEntries(id1, id2);
      await store.linkEntries(id1, id2); // Try to link again

      const entry = await store.getById(id1);
      const linkCount = entry.relatedIds.filter(id => id === id2).length;
      expect(linkCount).to.equal(1);
    });

    it('should throw error when linking non-existent source', async () => {
      const targetId = await store.addEntry({
        type: 'insight',
        content: 'Some insight',
        confidence: 0.7,
        verified: false,
        tags: []
      });

      try {
        await store.linkEntries('non-existent-id', targetId);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('not found');
      }
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      // Add diverse test data
      await store.addEntry({
        type: 'decision',
        content: 'Decision 1',
        confidence: 0.9,
        verified: true,
        tags: []
      });

      await store.addEntry({
        type: 'decision',
        content: 'Decision 2',
        confidence: 0.7,
        verified: false,
        tags: []
      });

      await store.addEntry({
        type: 'error',
        content: 'Error 1',
        confidence: 0.4,
        verified: false,
        tags: []
      });

      await store.addEntry({
        type: 'solution',
        content: 'Solution 1',
        confidence: 0.95,
        verified: true,
        tags: []
      });
    });

    it('should return correct total entries', async () => {
      const stats = await store.getStats();
      expect(stats.totalEntries).to.equal(4);
    });

    it('should count entries by type', async () => {
      const stats = await store.getStats();

      expect(stats.byType.decision).to.equal(2);
      expect(stats.byType.error).to.equal(1);
      expect(stats.byType.solution).to.equal(1);
      expect(stats.byType.pattern).to.equal(0);
      expect(stats.byType.insight).to.equal(0);
    });

    it('should count entries by confidence level', async () => {
      const stats = await store.getStats();

      expect(stats.byConfidence.high).to.equal(2); // 0.9 and 0.95
      expect(stats.byConfidence.medium).to.equal(1); // 0.7
      expect(stats.byConfidence.low).to.equal(1); // 0.4
    });

    it('should count verified entries', async () => {
      const stats = await store.getStats();
      expect(stats.verified).to.equal(2);
    });

    it('should identify most accessed entry', async () => {
      // Access one entry multiple times
      const results = await store.search('Decision 1');
      const targetId = results[0].id;

      await store.search('Decision 1');
      await store.search('Decision 1');

      const stats = await store.getStats();
      expect(stats.mostAccessedId).to.equal(targetId);
    });

    it('should handle empty database', async () => {
      const emptyStore = new KnowledgeStore(path.join(testProjectPath, 'empty'));
      await emptyStore.initialize();

      const stats = await emptyStore.getStats();

      expect(stats.totalEntries).to.equal(0);
      expect(stats.byType.decision).to.equal(0);
      expect(stats.byConfidence.high).to.equal(0);
      expect(stats.verified).to.equal(0);
    });
  });

  describe('Markdown Export', () => {
    beforeEach(async () => {
      await store.addEntry({
        type: 'decision',
        content: 'Use TypeScript',
        context: 'For type safety',
        confidence: 0.9,
        verified: true,
        tags: ['typescript', 'language']
      });

      await store.addEntry({
        type: 'solution',
        content: 'Fixed memory leak',
        context: 'In event listeners',
        confidence: 0.85,
        verified: true,
        tags: ['performance', 'bug']
      });
    });

    it('should export to markdown file', async () => {
      const exportPath = await store.exportMarkdown();

      expect(exportPath).to.be.a('string');
      expect(exportPath).to.include('knowledge-export.md');

      const fileExists = await fs.access(exportPath).then(() => true).catch(() => false);
      expect(fileExists).to.be.true;
    });

    it('should include all entries in export', async () => {
      const exportPath = await store.exportMarkdown();
      const content = await fs.readFile(exportPath, 'utf-8');

      expect(content).to.include('Use TypeScript');
      expect(content).to.include('Fixed memory leak');
    });

    it('should format markdown correctly', async () => {
      const exportPath = await store.exportMarkdown();
      const content = await fs.readFile(exportPath, 'utf-8');

      expect(content).to.include('# Project Knowledge Base');
      expect(content).to.include('## Decisions');
      expect(content).to.include('## Solutions');
      expect(content).to.include('**Confidence:**');
      expect(content).to.include('**Verified:**');
    });

    it('should sort by confidence within types', async () => {
      await store.addEntry({
        type: 'decision',
        content: 'Lower confidence decision',
        confidence: 0.5,
        verified: false,
        tags: []
      });

      const exportPath = await store.exportMarkdown();
      const content = await fs.readFile(exportPath, 'utf-8');

      const tsIndex = content.indexOf('Use TypeScript');
      const lowIndex = content.indexOf('Lower confidence decision');

      expect(tsIndex).to.be.lessThan(lowIndex);
    });

    it('should include context and tags', async () => {
      const exportPath = await store.exportMarkdown();
      const content = await fs.readFile(exportPath, 'utf-8');

      expect(content).to.include('For type safety');
      expect(content).to.include('typescript, language');
    });
  });
});
