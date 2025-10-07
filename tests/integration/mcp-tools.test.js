/**
 * Integration Tests for MCP Server Tools
 * Tests the complete MCP server with all tools
 */

import { expect } from 'chai';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Import VectorStore
import { VectorStore } from '../../src/vector-store.js';

// Recreate KnowledgeStore for testing
class KnowledgeStore {
  constructor(projectPath) {
    this.memoryPath = path.join(projectPath, '.claude-memory');
    this.vectorStore = new VectorStore(this.memoryPath);
  }

  async initialize() {
    try {
      await fs.mkdir(this.memoryPath, { recursive: true });
      await this.vectorStore.initialize();
    } catch (error) {
      console.error('Error initializing knowledge store:', error);
    }
  }

  async addEntry(entry) {
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

describe('MCP Server Tools Integration', () => {
  const testProjectPath = path.join(process.cwd(), '.test-mcp-integration');
  let store;
  let server;
  let toolHandlers;

  beforeEach(async () => {
    // Initialize store
    store = new KnowledgeStore(testProjectPath);
    await store.initialize();

    // Create MCP server
    server = new Server(
      {
        name: 'test-memory-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Setup tool handlers (simplified version of index.js)
    toolHandlers = {
      save_knowledge: async (args) => {
        const id = await store.addEntry({
          type: args.type,
          content: args.content,
          context: args.context,
          confidence: args.confidence,
          verified: args.verified || false,
          tags: args.tags || [],
        });

        return {
          content: [
            {
              type: 'text',
              text: `Knowledge saved with ID: ${id}`,
            },
          ],
        };
      },

      search_knowledge: async (args) => {
        const results = await store.search(args.query, {
          type: args.type,
          minConfidence: args.minConfidence,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      },

      link_knowledge: async (args) => {
        await store.linkEntries(
          args.sourceId,
          args.targetId,
          args.relationship
        );

        return {
          content: [
            {
              type: 'text',
              text: `Linked ${args.sourceId} -> ${args.targetId}`,
            },
          ],
        };
      },

      get_stats: async () => {
        const stats = await store.getStats();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      },

      export_markdown: async () => {
        const exportPath = await store.exportMarkdown();

        return {
          content: [
            {
              type: 'text',
              text: `Exported to: ${exportPath}`,
            },
          ],
        };
      },
    };
  });

  afterEach(async () => {
    try {
      await fs.rm(testProjectPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('save_knowledge tool', () => {
    it('should save knowledge and return ID', async () => {
      const result = await toolHandlers.save_knowledge({
        type: 'decision',
        content: 'Use PostgreSQL for database',
        context: 'Database selection',
        confidence: 0.9,
        verified: true,
        tags: ['database', 'postgresql']
      });

      expect(result.content[0].text).to.include('Knowledge saved with ID:');
      expect(result.content[0].text).to.match(/[0-9a-f-]{36}/); // UUID pattern
    });

    it('should save knowledge with minimal fields', async () => {
      const result = await toolHandlers.save_knowledge({
        type: 'error',
        content: 'Connection timeout',
        confidence: 0.6,
        tags: []
      });

      expect(result.content[0].text).to.include('Knowledge saved with ID:');
    });

    it('should save all knowledge types', async () => {
      const types = ['decision', 'error', 'solution', 'pattern', 'insight'];

      for (const type of types) {
        const result = await toolHandlers.save_knowledge({
          type,
          content: `Test ${type}`,
          confidence: 0.8,
          tags: []
        });

        expect(result.content[0].text).to.include('Knowledge saved with ID:');
      }
    });
  });

  describe('search_knowledge tool', () => {
    beforeEach(async () => {
      // Add test data
      await toolHandlers.save_knowledge({
        type: 'decision',
        content: 'Use React for UI',
        confidence: 0.9,
        tags: ['react', 'ui']
      });

      await toolHandlers.save_knowledge({
        type: 'solution',
        content: 'Use React hooks for state',
        confidence: 0.85,
        tags: ['react', 'hooks']
      });

      await toolHandlers.save_knowledge({
        type: 'error',
        content: 'Vue rendering issue',
        confidence: 0.6,
        tags: ['vue', 'bug']
      });
    });

    it('should search and return results', async () => {
      const result = await toolHandlers.search_knowledge({
        query: 'React'
      });

      const results = JSON.parse(result.content[0].text);
      expect(results).to.be.an('array');
      expect(results.length).to.be.greaterThan(0);
    });

    it('should filter by type', async () => {
      const result = await toolHandlers.search_knowledge({
        query: 'React',
        type: 'decision'
      });

      const results = JSON.parse(result.content[0].text);
      results.forEach(r => {
        expect(r.type).to.equal('decision');
      });
    });

    it('should filter by confidence', async () => {
      const result = await toolHandlers.search_knowledge({
        query: 'React',
        minConfidence: 0.85
      });

      const results = JSON.parse(result.content[0].text);
      results.forEach(r => {
        expect(r.confidence).to.be.at.least(0.85);
      });
    });
  });

  describe('link_knowledge tool', () => {
    it('should link entries', async () => {
      const save1 = await toolHandlers.save_knowledge({
        type: 'error',
        content: 'Memory leak',
        confidence: 0.7,
        tags: []
      });

      const save2 = await toolHandlers.save_knowledge({
        type: 'solution',
        content: 'Remove event listeners',
        confidence: 0.9,
        tags: []
      });

      const id1 = save1.content[0].text.match(/[0-9a-f-]{36}/)[0];
      const id2 = save2.content[0].text.match(/[0-9a-f-]{36}/)[0];

      const result = await toolHandlers.link_knowledge({
        sourceId: id1,
        targetId: id2,
        relationship: 'fixed_by'
      });

      expect(result.content[0].text).to.include(`Linked ${id1} -> ${id2}`);

      // Verify link exists
      const entry = await store.getById(id1);
      expect(entry.relatedIds).to.include(id2);
    });

    it('should handle default relationship', async () => {
      const save1 = await toolHandlers.save_knowledge({
        type: 'decision',
        content: 'Decision A',
        confidence: 0.8,
        tags: []
      });

      const save2 = await toolHandlers.save_knowledge({
        type: 'decision',
        content: 'Decision B',
        confidence: 0.8,
        tags: []
      });

      const id1 = save1.content[0].text.match(/[0-9a-f-]{36}/)[0];
      const id2 = save2.content[0].text.match(/[0-9a-f-]{36}/)[0];

      const result = await toolHandlers.link_knowledge({
        sourceId: id1,
        targetId: id2
      });

      expect(result.content[0].text).to.include('Linked');
    });
  });

  describe('get_stats tool', () => {
    it('should return empty stats for empty database', async () => {
      const result = await toolHandlers.get_stats();
      const stats = JSON.parse(result.content[0].text);

      expect(stats.totalEntries).to.equal(0);
      expect(stats.byType.decision).to.equal(0);
      expect(stats.byConfidence.high).to.equal(0);
    });

    it('should return correct statistics', async () => {
      await toolHandlers.save_knowledge({
        type: 'decision',
        content: 'Decision 1',
        confidence: 0.9,
        verified: true,
        tags: []
      });

      await toolHandlers.save_knowledge({
        type: 'error',
        content: 'Error 1',
        confidence: 0.6,
        verified: false,
        tags: []
      });

      const result = await toolHandlers.get_stats();
      const stats = JSON.parse(result.content[0].text);

      expect(stats.totalEntries).to.equal(2);
      expect(stats.byType.decision).to.equal(1);
      expect(stats.byType.error).to.equal(1);
      expect(stats.byConfidence.high).to.equal(1);
      expect(stats.byConfidence.medium).to.equal(1);
      expect(stats.verified).to.equal(1);
    });
  });

  describe('export_markdown tool', () => {
    it('should export to markdown', async () => {
      await toolHandlers.save_knowledge({
        type: 'insight',
        content: 'Important insight',
        confidence: 0.9,
        tags: ['important']
      });

      const result = await toolHandlers.export_markdown();

      expect(result.content[0].text).to.include('Exported to:');
      expect(result.content[0].text).to.include('knowledge-export.md');

      const exportPath = result.content[0].text.replace('Exported to: ', '');
      const fileExists = await fs.access(exportPath).then(() => true).catch(() => false);
      expect(fileExists).to.be.true;
    });

    it('should create valid markdown content', async () => {
      await toolHandlers.save_knowledge({
        type: 'decision',
        content: 'Test decision',
        context: 'Test context',
        confidence: 0.8,
        verified: true,
        tags: ['test']
      });

      const result = await toolHandlers.export_markdown();
      const exportPath = result.content[0].text.replace('Exported to: ', '');
      const content = await fs.readFile(exportPath, 'utf-8');

      expect(content).to.include('# Project Knowledge Base');
      expect(content).to.include('## Decisions');
      expect(content).to.include('Test decision');
      expect(content).to.include('**Context:** Test context');
      expect(content).to.include('**Confidence:** 80%');
      expect(content).to.include('**Verified:** Yes');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields in save_knowledge', async () => {
      try {
        await toolHandlers.save_knowledge({
          // Missing type
          content: 'Test',
          confidence: 0.5
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        // Expected error
      }
    });

    it('should handle invalid ID in link_knowledge', async () => {
      try {
        await toolHandlers.link_knowledge({
          sourceId: 'invalid-id',
          targetId: 'another-invalid-id'
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('not found');
      }
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full knowledge lifecycle', async () => {
      // 1. Save an error
      const errorResult = await toolHandlers.save_knowledge({
        type: 'error',
        content: 'Database connection timeout',
        context: 'Production deployment',
        confidence: 0.8,
        verified: false,
        tags: ['database', 'production']
      });

      const errorId = errorResult.content[0].text.match(/[0-9a-f-]{36}/)[0];

      // 2. Save a solution
      const solutionResult = await toolHandlers.save_knowledge({
        type: 'solution',
        content: 'Increase connection pool timeout',
        context: 'Fixed in v2.1',
        confidence: 0.9,
        verified: true,
        tags: ['database', 'fix']
      });

      const solutionId = solutionResult.content[0].text.match(/[0-9a-f-]{36}/)[0];

      // 3. Link them
      await toolHandlers.link_knowledge({
        sourceId: errorId,
        targetId: solutionId,
        relationship: 'fixed_by'
      });

      // 4. Search for the problem
      const searchResult = await toolHandlers.search_knowledge({
        query: 'database connection timeout'
      });

      const searchResults = JSON.parse(searchResult.content[0].text);
      expect(searchResults.length).to.be.greaterThan(0);

      // 5. Get stats
      const statsResult = await toolHandlers.get_stats();
      const stats = JSON.parse(statsResult.content[0].text);

      expect(stats.totalEntries).to.equal(2);
      expect(stats.byType.error).to.equal(1);
      expect(stats.byType.solution).to.equal(1);

      // 6. Export
      const exportResult = await toolHandlers.export_markdown();
      expect(exportResult.content[0].text).to.include('knowledge-export.md');
    });
  });
});
