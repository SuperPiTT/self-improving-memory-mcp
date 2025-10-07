import { expect } from 'chai';
import {
  clusterEntries,
  analyzeFrequency,
  generateInsights,
  detectAntiPatterns,
  suggestTags
} from '../../src/utils/patterns.js';

describe('Pattern Emergence & Analysis', () => {
  const createEntry = (id, type, content, confidence, tags = [], embedding = null, timestamp = Date.now()) => ({
    id,
    type,
    content,
    confidence,
    tags,
    embedding: embedding || [Math.random(), Math.random(), Math.random()],
    timestamp,
    accessCount: Math.floor(Math.random() * 10),
    verified: Math.random() > 0.5,
    relatedIds: []
  });

  describe('clusterEntries', () => {
    it('should cluster similar entries', () => {
      const entries = [
        createEntry('1', 'error', 'Database timeout', 0.9, ['db'], [1, 0, 0]),
        createEntry('2', 'error', 'DB connection lost', 0.8, ['db'], [0.95, 0, 0]),
        createEntry('3', 'solution', 'Use Redis', 0.9, ['cache'], [0, 1, 0]),
        createEntry('4', 'solution', 'Cache with Redis', 0.85, ['cache'], [0, 0.9, 0])
      ];

      const clusters = clusterEntries(entries, { similarityThreshold: 0.85, minClusterSize: 2 });

      expect(clusters).to.have.length.at.least(1);
      expect(clusters[0].size).to.be.at.least(2);
    });

    it('should respect minimum cluster size', () => {
      const entries = [
        createEntry('1', 'error', 'Error A', 0.9, [], [1, 0, 0]),
        createEntry('2', 'error', 'Error B', 0.8, [], [0, 1, 0]) // Not similar
      ];

      const clusters = clusterEntries(entries, { minClusterSize: 2 });

      expect(clusters).to.have.length(0); // No cluster meets min size
    });

    it('should respect similarity threshold', () => {
      const entries = [
        createEntry('1', 'error', 'A', 0.9, [], [1, 0, 0]),
        createEntry('2', 'error', 'B', 0.8, [], [0.6, 0.6, 0]) // Lower similarity
      ];

      const clusters = clusterEntries(entries, { similarityThreshold: 0.95, minClusterSize: 2 });

      expect(clusters).to.have.length(0);
    });

    it('should calculate cluster statistics', () => {
      const entries = [
        createEntry('1', 'solution', 'Use Redis', 0.9, ['cache'], [1, 0, 0]),
        createEntry('2', 'solution', 'Redis caching', 0.8, ['cache', 'db'], [0.95, 0, 0])
      ];

      const clusters = clusterEntries(entries, { similarityThreshold: 0.85, minClusterSize: 2 });

      expect(clusters[0]).to.have.property('size', 2);
      expect(clusters[0]).to.have.property('avgConfidence');
      expect(clusters[0].avgConfidence).to.be.closeTo(0.85, 0.01);
      expect(clusters[0].types).to.include('solution');
      expect(clusters[0].tags).to.include('cache');
    });

    it('should handle empty entries', () => {
      const clusters = clusterEntries([]);
      expect(clusters).to.have.length(0);
    });

    it('should handle entries without embeddings', () => {
      const entries = [
        { ...createEntry('1', 'error', 'A', 0.9), embedding: null },
        { ...createEntry('2', 'error', 'B', 0.8), embedding: null }
      ];

      const clusters = clusterEntries(entries);
      expect(clusters).to.have.length(0);
    });

    it('should limit max clusters', () => {
      const entries = Array.from({ length: 20 }, (_, i) =>
        createEntry(`${i}`, 'solution', `Solution ${i}`, 0.8, [], [i / 20, 0, 0])
      );

      const clusters = clusterEntries(entries, { maxClusters: 3, minClusterSize: 1 });

      expect(clusters).to.have.length.at.most(3);
    });
  });

  describe('analyzeFrequency', () => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    it('should detect recurring errors', () => {
      const entries = [
        createEntry('1', 'error', 'Database timeout error', 0.9, [], null, now - 2 * dayMs),
        createEntry('2', 'error', 'Database timeout error', 0.8, [], null, now - 1 * dayMs),
        createEntry('3', 'error', 'Database timeout error', 0.7, [], null, now)
      ];

      const analysis = analyzeFrequency(entries);

      expect(analysis.errorPatterns).to.have.length.at.least(1);
      expect(analysis.errorPatterns[0].count).to.be.at.least(2);
    });

    it('should track tag frequency', () => {
      const entries = [
        createEntry('1', 'solution', 'A', 0.9, ['cache', 'redis']),
        createEntry('2', 'solution', 'B', 0.8, ['cache', 'db']),
        createEntry('3', 'error', 'C', 0.7, ['cache'])
      ];

      const analysis = analyzeFrequency(entries);

      expect(analysis.tagFrequency).to.have.property('cache', 3);
      expect(analysis.tagFrequency).to.have.property('redis', 1);
    });

    it('should calculate type distribution', () => {
      const entries = [
        createEntry('1', 'error', 'A', 0.9),
        createEntry('2', 'error', 'B', 0.8),
        createEntry('3', 'solution', 'C', 0.7)
      ];

      const analysis = analyzeFrequency(entries);

      expect(analysis.typeDistribution).to.have.property('error', 2);
      expect(analysis.typeDistribution).to.have.property('solution', 1);
    });

    it('should analyze temporal patterns', () => {
      const entries = [
        createEntry('1', 'error', 'A', 0.9, [], null, now - 3 * dayMs),
        createEntry('2', 'error', 'B', 0.8, [], null, now - 1 * dayMs),
        createEntry('3', 'solution', 'C', 0.7, [], null, now)
      ];

      const analysis = analyzeFrequency(entries);

      expect(analysis.temporalPatterns).to.have.property('last7Days');
      expect(analysis.temporalPatterns).to.have.property('last30Days');
      expect(analysis.temporalPatterns).to.have.property('trend');
      expect(analysis.temporalPatterns.last7Days).to.equal(3);
    });

    it('should calculate confidence trends by type', () => {
      const entries = [
        createEntry('1', 'error', 'A', 0.9),
        createEntry('2', 'error', 'B', 0.7),
        createEntry('3', 'solution', 'C', 0.8)
      ];

      const analysis = analyzeFrequency(entries);

      expect(analysis.confidenceTrends).to.be.an('array');
      const errorTrend = analysis.confidenceTrends.find(t => t.type === 'error');
      expect(errorTrend).to.exist;
      expect(errorTrend.avg).to.equal(0.8);
      expect(errorTrend.min).to.equal(0.7);
      expect(errorTrend.max).to.equal(0.9);
    });

    it('should handle empty entries', () => {
      const analysis = analyzeFrequency([]);

      expect(analysis.errorPatterns).to.have.length(0);
      expect(analysis.tagFrequency).to.deep.equal({});
      expect(analysis.typeDistribution).to.deep.equal({});
    });
  });

  describe('generateInsights', () => {
    it('should generate cluster insights', () => {
      const clusters = [
        {
          size: 5,
          avgConfidence: 0.85,
          types: ['solution'],
          tags: ['cache', 'redis'],
          centroid: { content: 'Use Redis for caching' }
        }
      ];

      const frequencyAnalysis = {
        errorPatterns: [],
        tagFrequency: {},
        temporalPatterns: { trend: 'stable', last7Days: 2 }
      };

      const insights = generateInsights(clusters, frequencyAnalysis, []);

      expect(insights).to.be.an('array');
      const clusterInsight = insights.find(i => i.type === 'cluster');
      expect(clusterInsight).to.exist;
      expect(clusterInsight.priority).to.equal('high');
    });

    it('should generate recurring error insights', () => {
      const frequencyAnalysis = {
        errorPatterns: [
          { pattern: 'Database timeout', count: 5, firstSeen: Date.now(), lastSeen: Date.now() }
        ],
        temporalPatterns: { trend: 'stable' },
        confidenceTrends: []
      };

      const insights = generateInsights([], frequencyAnalysis, []);

      const errorInsight = insights.find(i => i.type === 'error');
      expect(errorInsight).to.exist;
      expect(errorInsight.priority).to.equal('critical');
      expect(errorInsight.data.count).to.equal(5);
    });

    it('should detect low confidence patterns', () => {
      const frequencyAnalysis = {
        errorPatterns: [],
        temporalPatterns: { trend: 'stable' },
        confidenceTrends: [
          { type: 'decision', avg: 0.4, min: 0.2, max: 0.6, count: 5 }
        ]
      };

      const insights = generateInsights([], frequencyAnalysis, []);

      const qualityInsight = insights.find(i => i.type === 'quality');
      expect(qualityInsight).to.exist;
      expect(qualityInsight.priority).to.equal('medium');
    });

    it('should detect underutilized knowledge', () => {
      const entries = Array.from({ length: 10 }, (_, i) =>
        createEntry(`${i}`, 'solution', `Sol ${i}`, 0.8, [], null, Date.now())
      );
      // Set half to never accessed
      entries.forEach((e, i) => {
        if (i < 5) e.accessCount = 0;
      });

      const insights = generateInsights([], { errorPatterns: [], temporalPatterns: { trend: 'stable' }, confidenceTrends: [] }, entries);

      const usageInsight = insights.find(i => i.type === 'usage');
      expect(usageInsight).to.exist;
    });

    it('should sort insights by priority', () => {
      const frequencyAnalysis = {
        errorPatterns: [{ pattern: 'Error', count: 3, firstSeen: Date.now(), lastSeen: Date.now() }],
        temporalPatterns: { trend: 'stable' },
        confidenceTrends: [{ type: 'decision', avg: 0.4, count: 5 }]
      };

      const insights = generateInsights([], frequencyAnalysis, []);

      // Critical should come before medium
      const criticalIdx = insights.findIndex(i => i.priority === 'critical');
      const mediumIdx = insights.findIndex(i => i.priority === 'medium');

      if (criticalIdx >= 0 && mediumIdx >= 0) {
        expect(criticalIdx).to.be.lessThan(mediumIdx);
      }
    });
  });

  describe('detectAntiPatterns', () => {
    it('should detect duplicate entries', () => {
      const entries = [
        createEntry('1', 'solution', 'Use Redis for caching', 0.9),
        createEntry('2', 'solution', 'Use Redis for caching', 0.8),
        createEntry('3', 'solution', 'Different solution', 0.7)
      ];

      const frequencyAnalysis = analyzeFrequency(entries);
      const antiPatterns = detectAntiPatterns(entries, frequencyAnalysis);

      const duplication = antiPatterns.find(ap => ap.type === 'duplication');
      expect(duplication).to.exist;
      expect(duplication.severity).to.equal('medium');
    });

    it('should detect low quality knowledge base', () => {
      const entries = Array.from({ length: 10 }, (_, i) =>
        createEntry(`${i}`, 'solution', `Sol ${i}`, 0.3) // All low confidence
      );

      const frequencyAnalysis = analyzeFrequency(entries);
      const antiPatterns = detectAntiPatterns(entries, frequencyAnalysis);

      const lowQuality = antiPatterns.find(ap => ap.type === 'low_quality');
      expect(lowQuality).to.exist;
      expect(lowQuality.severity).to.equal('high');
    });

    it('should detect untagged entries', () => {
      const entries = Array.from({ length: 10 }, (_, i) =>
        createEntry(`${i}`, 'solution', `Sol ${i}`, 0.8, []) // No tags
      );

      const frequencyAnalysis = analyzeFrequency(entries);
      const antiPatterns = detectAntiPatterns(entries, frequencyAnalysis);

      const organization = antiPatterns.find(ap => ap.type === 'organization');
      expect(organization).to.exist;
    });

    it('should detect errors without solutions', () => {
      const entries = [
        createEntry('e1', 'error', 'Error 1', 0.9),
        createEntry('e2', 'error', 'Error 2', 0.9),
        createEntry('e3', 'error', 'Error 3', 0.9),
        createEntry('s1', 'solution', 'Solution 1', 0.9)
      ];
      // Link one error to solution
      entries[0].relatedIds = ['s1'];

      const frequencyAnalysis = analyzeFrequency(entries);
      const antiPatterns = detectAntiPatterns(entries, frequencyAnalysis);

      const incomplete = antiPatterns.find(ap => ap.type === 'incomplete');
      // Should detect that 2 of 3 errors (>50%) have no solutions
      expect(incomplete).to.exist;
    });

    it('should return empty for clean knowledge base', () => {
      const entries = [
        createEntry('1', 'solution', 'Unique solution A', 0.9, ['tag1']),
        createEntry('2', 'solution', 'Unique solution B', 0.85, ['tag2'])
      ];

      const frequencyAnalysis = analyzeFrequency(entries);
      const antiPatterns = detectAntiPatterns(entries, frequencyAnalysis);

      expect(antiPatterns).to.have.length(0);
    });
  });

  describe('suggestTags', () => {
    it('should suggest tags from cluster content', () => {
      const clusters = [
        {
          size: 3,
          avgConfidence: 0.85,
          entries: [
            createEntry('1', 'solution', 'database connection pool', 0.9),
            createEntry('2', 'solution', 'database timeout handling', 0.8),
            createEntry('3', 'solution', 'database retry logic', 0.85)
          ]
        }
      ];

      const suggestions = suggestTags(clusters, []);

      expect(suggestions).to.be.an('array');
      if (suggestions.length > 0) {
        expect(suggestions[0]).to.have.property('suggestedTag');
        expect(suggestions[0]).to.have.property('clusterSize', 3);
        expect(suggestions[0]).to.have.property('reason');
      }
    });

    it('should require minimum cluster size', () => {
      const clusters = [
        {
          size: 2,
          avgConfidence: 0.85,
          entries: [
            createEntry('1', 'solution', 'small cluster', 0.9),
            createEntry('2', 'solution', 'another entry', 0.8)
          ]
        }
      ];

      const suggestions = suggestTags(clusters, []);

      // Should have no suggestions for cluster < 3
      expect(suggestions).to.have.length(0);
    });

    it('should provide alternative tags', () => {
      const clusters = [
        {
          size: 4,
          avgConfidence: 0.85,
          entries: [
            createEntry('1', 'solution', 'redis cache implementation', 0.9),
            createEntry('2', 'solution', 'redis cache configuration', 0.8),
            createEntry('3', 'solution', 'cache redis strategy', 0.85),
            createEntry('4', 'solution', 'implementation cache details', 0.8)
          ]
        }
      ];

      const suggestions = suggestTags(clusters, []);

      if (suggestions.length > 0 && suggestions[0].alternativeTags) {
        expect(suggestions[0].alternativeTags).to.be.an('array');
      }
    });

    it('should handle empty clusters', () => {
      const suggestions = suggestTags([], []);
      expect(suggestions).to.have.length(0);
    });
  });

  describe('Integration', () => {
    it('should work together to provide complete analysis', () => {
      const entries = [
        createEntry('1', 'error', 'Database timeout', 0.9, ['db'], [1, 0, 0]),
        createEntry('2', 'error', 'Database connection lost', 0.8, ['db'], [0.95, 0, 0]),
        createEntry('3', 'solution', 'Use connection pooling', 0.85, ['db', 'pool'], [1, 0.1, 0]),
        createEntry('4', 'solution', 'Implement retry logic', 0.9, ['retry'], [0.9, 0, 0])
      ];

      const clusters = clusterEntries(entries, { similarityThreshold: 0.8, minClusterSize: 2 });
      const frequencyAnalysis = analyzeFrequency(entries);
      const insights = generateInsights(clusters, frequencyAnalysis, entries);
      const antiPatterns = detectAntiPatterns(entries, frequencyAnalysis);
      const tagSuggestions = suggestTags(clusters, entries);

      expect(clusters).to.be.an('array');
      expect(frequencyAnalysis).to.be.an('object');
      expect(insights).to.be.an('array');
      expect(antiPatterns).to.be.an('array');
      expect(tagSuggestions).to.be.an('array');
    });
  });
});
