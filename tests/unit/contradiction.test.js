import { expect } from 'chai';
import {
  detectContradictions,
  resolveContradiction,
  autoResolveContradictions,
  getSupersededHistory,
  findPotentialConflicts
} from '../../src/utils/contradiction.js';

describe('Contradiction Detection', () => {
  const createMockEntry = (id, content, confidence, embedding, type = 'solution') => ({
    id,
    type,
    content,
    confidence,
    verified: false,
    accessCount: 0,
    tags: [],
    relatedIds: [],
    embedding
  });

  const mockVectorStore = {
    entries: new Map(),

    async getAllEntries() {
      return Array.from(this.entries.values());
    },

    async getById(id) {
      return this.entries.get(id);
    },

    async updateMetadata(id, updates) {
      const entry = this.entries.get(id);
      if (entry) {
        Object.assign(entry, updates);
      }
    },

    reset() {
      this.entries.clear();
    }
  };

  describe('detectContradictions', () => {
    it('should detect high similarity with confidence difference', async () => {
      const entries = [
        createMockEntry('1', 'Use Redis for caching', 0.9, [1, 0, 0, 0]),
        createMockEntry('2', 'Use Redis for caching', 0.6, [0.99, 0, 0, 0])
      ];

      const contradictions = await detectContradictions(entries);

      expect(contradictions).to.have.length(1);
      expect(contradictions[0]).to.have.property('entry1', '1');
      expect(contradictions[0]).to.have.property('entry2', '2');
      expect(contradictions[0].similarity).to.be.greaterThan(0.85);
      expect(contradictions[0].confidenceDelta).to.be.closeTo(0.3, 0.001);
    });

    it('should identify winner and loser based on confidence', async () => {
      const entries = [
        createMockEntry('1', 'Solution A', 0.9, [1, 0, 0, 0]),
        createMockEntry('2', 'Solution A', 0.6, [0.99, 0, 0, 0])
      ];

      const contradictions = await detectContradictions(entries);

      expect(contradictions[0].winner).to.equal('1');
      expect(contradictions[0].loser).to.equal('2');
    });

    it('should not flag related entries as contradictions', async () => {
      const entries = [
        createMockEntry('1', 'Use Redis', 0.9, [1, 0, 0, 0]),
        createMockEntry('2', 'Use Redis', 0.6, [0.99, 0, 0, 0])
      ];
      entries[0].relatedIds = ['2'];

      const contradictions = await detectContradictions(entries);

      expect(contradictions).to.have.length(0);
    });

    it('should respect similarity threshold', async () => {
      const entries = [
        createMockEntry('1', 'Solution A', 0.9, [1, 0, 0, 0]),
        createMockEntry('2', 'Solution B', 0.6, [0.7, 0.7, 0, 0]) // Lower similarity
      ];

      const contradictions = await detectContradictions(entries, {
        similarityThreshold: 0.95
      });

      expect(contradictions).to.have.length(0);
    });

    it('should respect minConfidenceDelta', async () => {
      const entries = [
        createMockEntry('1', 'Solution A', 0.85, [1, 0, 0, 0]),
        createMockEntry('2', 'Solution A', 0.80, [0.99, 0, 0, 0])
      ];

      const contradictions = await detectContradictions(entries, {
        minConfidenceDelta: 0.1
      });

      expect(contradictions).to.have.length(0); // Delta is 0.05, below threshold
    });

    it('should only check same type when sameTypeOnly is true', async () => {
      const entries = [
        createMockEntry('1', 'Solution A', 0.9, [1, 0, 0, 0], 'solution'),
        createMockEntry('2', 'Solution A', 0.6, [0.99, 0, 0, 0], 'pattern')
      ];

      const contradictions = await detectContradictions(entries, {
        sameTypeOnly: true
      });

      expect(contradictions).to.have.length(0);
    });

    it('should include contradiction reason', async () => {
      const entries = [
        createMockEntry('1', 'Solution A', 0.9, [1, 0, 0, 0]),
        createMockEntry('2', 'Solution A', 0.5, [0.99, 0, 0, 0])
      ];

      const contradictions = await detectContradictions(entries);

      expect(contradictions[0].reason).to.be.a('string');
      expect(contradictions[0].reason.toLowerCase()).to.match(/similar|identical|confidence/);
    });
  });

  describe('resolveContradiction', () => {
    beforeEach(() => {
      mockVectorStore.reset();
    });

    it('should mark loser as superseded', async () => {
      const entry1 = createMockEntry('1', 'Solution A', 0.9, [1, 0, 0, 0]);
      const entry2 = createMockEntry('2', 'Solution A', 0.6, [0.99, 0, 0, 0]);

      mockVectorStore.entries.set('1', entry1);
      mockVectorStore.entries.set('2', entry2);

      const contradiction = {
        winner: '1',
        loser: '2',
        reason: 'Test contradiction',
        similarity: 0.99
      };

      const result = await resolveContradiction(mockVectorStore, contradiction);

      const loser = await mockVectorStore.getById('2');

      expect(loser.superseded).to.be.true;
      expect(loser.supersededBy).to.equal('1');
      expect(loser.supersededReason).to.equal('Test contradiction');
      expect(loser.confidence).to.be.lessThan(0.6);
    });

    it('should add to winner\'s supersedes list', async () => {
      const entry1 = createMockEntry('1', 'Solution A', 0.9, [1, 0, 0, 0]);
      const entry2 = createMockEntry('2', 'Solution A', 0.6, [0.99, 0, 0, 0]);

      mockVectorStore.entries.set('1', entry1);
      mockVectorStore.entries.set('2', entry2);

      const contradiction = {
        winner: '1',
        loser: '2',
        reason: 'Test contradiction',
        similarity: 0.99
      };

      await resolveContradiction(mockVectorStore, contradiction);

      const winner = await mockVectorStore.getById('1');

      expect(winner.supersedes).to.be.an('array');
      expect(winner.supersedes).to.have.length(1);
      expect(winner.supersedes[0].id).to.equal('2');
    });

    it('should return resolution result', async () => {
      const entry1 = createMockEntry('1', 'Solution A', 0.9, [1, 0, 0, 0]);
      const entry2 = createMockEntry('2', 'Solution A', 0.6, [0.99, 0, 0, 0]);

      mockVectorStore.entries.set('1', entry1);
      mockVectorStore.entries.set('2', entry2);

      const contradiction = {
        winner: '1',
        loser: '2',
        reason: 'Test',
        similarity: 0.99
      };

      const result = await resolveContradiction(mockVectorStore, contradiction);

      expect(result).to.have.property('winner', '1');
      expect(result).to.have.property('loser', '2');
      expect(result).to.have.property('action', 'superseded');
      expect(result).to.have.property('resolution');
    });

    it('should throw if entry not found', async () => {
      const contradiction = {
        winner: 'nonexistent-1',
        loser: 'nonexistent-2',
        reason: 'Test',
        similarity: 0.99
      };

      try {
        await resolveContradiction(mockVectorStore, contradiction);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.message).to.include('not found');
      }
    });
  });

  describe('autoResolveContradictions', () => {
    beforeEach(() => {
      mockVectorStore.reset();
    });

    it('should detect and resolve multiple contradictions', async () => {
      const entries = [
        createMockEntry('1', 'Solution A', 0.9, [1, 0, 0, 0]),
        createMockEntry('2', 'Solution A', 0.6, [0.99, 0, 0, 0]),
        createMockEntry('3', 'Solution B', 0.8, [0, 1, 0, 0]),
        createMockEntry('4', 'Solution B', 0.5, [0, 0.99, 0, 0])
      ];

      entries.forEach(e => mockVectorStore.entries.set(e.id, e));

      const result = await autoResolveContradictions(mockVectorStore);

      expect(result.detected).to.equal(2);
      expect(result.resolved).to.equal(2);
      expect(result.failed).to.equal(0);
    });

    it('should not re-resolve superseded entries', async () => {
      const entries = [
        createMockEntry('1', 'Solution A', 0.9, [1, 0, 0, 0]),
        createMockEntry('2', 'Solution A', 0.6, [0.99, 0, 0, 0])
      ];
      entries[1].superseded = true;

      entries.forEach(e => mockVectorStore.entries.set(e.id, e));

      const result = await autoResolveContradictions(mockVectorStore);

      expect(result.detected).to.equal(0);
      expect(result.resolved).to.equal(0);
    });

    it('should return summary with resolutions', async () => {
      const entries = [
        createMockEntry('1', 'Solution A', 0.9, [1, 0, 0, 0]),
        createMockEntry('2', 'Solution A', 0.6, [0.99, 0, 0, 0])
      ];

      entries.forEach(e => mockVectorStore.entries.set(e.id, e));

      const result = await autoResolveContradictions(mockVectorStore);

      expect(result).to.have.property('detected');
      expect(result).to.have.property('resolved');
      expect(result).to.have.property('failed');
      expect(result).to.have.property('resolutions');
      expect(result).to.have.property('errors');
    });
  });

  describe('getSupersededHistory', () => {
    beforeEach(() => {
      mockVectorStore.reset();
    });

    it('should return only superseded entries', async () => {
      const entries = [
        createMockEntry('1', 'Winner', 0.9, [1, 0, 0, 0]),
        createMockEntry('2', 'Loser', 0.3, [0.99, 0, 0, 0])
      ];
      entries[1].superseded = true;
      entries[1].supersededBy = '1';
      entries[1].supersededAt = Date.now();

      entries.forEach(e => mockVectorStore.entries.set(e.id, e));

      const history = await getSupersededHistory(mockVectorStore);

      expect(history).to.have.length(1);
      expect(history[0].id).to.equal('2');
      expect(history[0].supersededBy).to.equal('1');
    });

    it('should include superseding entry details', async () => {
      const entries = [
        createMockEntry('1', 'Winner', 0.9, [1, 0, 0, 0]),
        createMockEntry('2', 'Loser', 0.3, [0.99, 0, 0, 0])
      ];
      entries[1].superseded = true;
      entries[1].supersededBy = '1';

      entries.forEach(e => mockVectorStore.entries.set(e.id, e));

      const history = await getSupersededHistory(mockVectorStore);

      expect(history[0].supersededByEntry).to.exist;
      expect(history[0].supersededByEntry.id).to.equal('1');
      expect(history[0].supersededByEntry.content).to.equal('Winner');
    });

    it('should return empty array if no superseded entries', async () => {
      const entries = [
        createMockEntry('1', 'Active', 0.9, [1, 0, 0, 0])
      ];

      entries.forEach(e => mockVectorStore.entries.set(e.id, e));

      const history = await getSupersededHistory(mockVectorStore);

      expect(history).to.have.length(0);
    });
  });

  describe('findPotentialConflicts', () => {
    beforeEach(() => {
      mockVectorStore.reset();
    });

    it('should find entries with high similarity', async () => {
      const existing = createMockEntry('1', 'Use Redis', 0.9, [1, 0, 0, 0]);
      mockVectorStore.entries.set('1', existing);

      const newEmbedding = [0.99, 0, 0, 0];

      const conflicts = await findPotentialConflicts(
        mockVectorStore,
        'Use Redis for caching',
        newEmbedding
      );

      expect(conflicts).to.have.length(1);
      expect(conflicts[0].entry.id).to.equal('1');
      expect(conflicts[0].similarity).to.be.greaterThan(0.85);
    });

    it('should provide recommendations', async () => {
      const existing = createMockEntry('1', 'Solution', 0.9, [1, 0, 0, 0]);
      mockVectorStore.entries.set('1', existing);

      const conflicts = await findPotentialConflicts(
        mockVectorStore,
        'Solution',
        [0.99, 0, 0, 0],
        0.85
      );

      expect(conflicts[0].recommendation).to.be.a('string');
    });

    it('should sort by similarity descending', async () => {
      const entries = [
        createMockEntry('1', 'A', 0.9, [1, 0, 0, 0]),
        createMockEntry('2', 'A', 0.9, [0.95, 0, 0, 0]),
        createMockEntry('3', 'A', 0.9, [0.90, 0, 0, 0])
      ];

      entries.forEach(e => mockVectorStore.entries.set(e.id, e));

      const conflicts = await findPotentialConflicts(
        mockVectorStore,
        'A',
        [1, 0, 0, 0],
        0.85
      );

      expect(conflicts).to.have.length(3);
      expect(conflicts[0].similarity).to.be.greaterThanOrEqual(conflicts[1].similarity);
      expect(conflicts[1].similarity).to.be.greaterThanOrEqual(conflicts[2].similarity);
    });

    it('should ignore superseded entries', async () => {
      const entries = [
        createMockEntry('1', 'Active', 0.9, [1, 0, 0, 0]),
        createMockEntry('2', 'Superseded', 0.9, [0.99, 0, 0, 0])
      ];
      entries[1].superseded = true;

      entries.forEach(e => mockVectorStore.entries.set(e.id, e));

      const conflicts = await findPotentialConflicts(
        mockVectorStore,
        'Test',
        [1, 0, 0, 0],
        0.85
      );

      expect(conflicts).to.have.length(1);
      expect(conflicts[0].entry.id).to.equal('1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty entries array', async () => {
      const contradictions = await detectContradictions([]);
      expect(contradictions).to.have.length(0);
    });

    it('should handle single entry', async () => {
      const entries = [
        createMockEntry('1', 'Solo', 0.9, [1, 0, 0, 0])
      ];

      const contradictions = await detectContradictions(entries);
      expect(contradictions).to.have.length(0);
    });

    it('should handle entries without embeddings', async () => {
      const entries = [
        { ...createMockEntry('1', 'A', 0.9, null), embedding: null },
        { ...createMockEntry('2', 'A', 0.6, null), embedding: null }
      ];

      const contradictions = await detectContradictions(entries);
      expect(contradictions).to.have.length(0);
    });

    it('should handle identical confidence scores', async () => {
      const entries = [
        createMockEntry('1', 'A', 0.8, [1, 0, 0, 0]),
        createMockEntry('2', 'A', 0.8, [0.99, 0, 0, 0])
      ];

      const contradictions = await detectContradictions(entries);

      // Should still detect but confidence delta is 0
      expect(contradictions).to.have.length(0); // Below minConfidenceDelta
    });
  });
});
