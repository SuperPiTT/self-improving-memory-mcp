import { expect } from 'chai';
import {
  buildKnowledgeGraph,
  exportGraph,
  findClusters,
  getGraphStats
} from '../../src/utils/graph.js';

describe('Knowledge Graph', () => {
  const sampleEntries = [
    {
      id: 'id-1',
      type: 'solution',
      content: 'Use Redis for caching',
      confidence: 0.9,
      verified: true,
      accessCount: 10,
      tags: ['caching', 'redis'],
      relatedIds: ['id-2']
    },
    {
      id: 'id-2',
      type: 'error',
      content: 'Database timeout',
      confidence: 1.0,
      verified: true,
      accessCount: 5,
      tags: ['database', 'error'],
      relatedIds: ['id-1', 'id-3']
    },
    {
      id: 'id-3',
      type: 'pattern',
      content: 'Retry pattern with exponential backoff',
      confidence: 0.85,
      verified: false,
      accessCount: 3,
      tags: ['pattern', 'retry'],
      relatedIds: []
    },
    {
      id: 'id-4',
      type: 'insight',
      content: 'Performance improved 50%',
      confidence: 0.95,
      verified: true,
      accessCount: 8,
      tags: ['performance'],
      relatedIds: []
    }
  ];

  describe('buildKnowledgeGraph', () => {
    it('should create nodes from entries', () => {
      const graph = buildKnowledgeGraph(sampleEntries);

      expect(graph.nodes).to.have.length(4);
      expect(graph.nodes[0]).to.have.property('id', 'id-1');
      expect(graph.nodes[0]).to.have.property('label');
      expect(graph.nodes[0]).to.have.property('type', 'solution');
      expect(graph.nodes[0]).to.have.property('color');
      expect(graph.nodes[0]).to.have.property('size');
    });

    it('should create edges from relationships', () => {
      const graph = buildKnowledgeGraph(sampleEntries);

      expect(graph.edges).to.have.length(3);

      const edge1 = graph.edges.find(e => e.from === 'id-1' && e.to === 'id-2');
      expect(edge1).to.exist;
      expect(edge1.label).to.equal('relates_to');
    });

    it('should include graph statistics', () => {
      const graph = buildKnowledgeGraph(sampleEntries);

      expect(graph.stats).to.have.property('totalNodes', 4);
      expect(graph.stats).to.have.property('totalEdges', 3);
      expect(graph.stats).to.have.property('nodesByType');
      expect(graph.stats.nodesByType.solution).to.equal(1);
      expect(graph.stats.nodesByType.error).to.equal(1);
    });

    it('should identify isolated nodes', () => {
      const graph = buildKnowledgeGraph(sampleEntries);

      expect(graph.stats.isolatedNodes).to.equal(1); // id-4 has no connections
    });

    it('should calculate node size based on importance', () => {
      const graph = buildKnowledgeGraph(sampleEntries);

      const node1 = graph.nodes.find(n => n.id === 'id-1');
      const node3 = graph.nodes.find(n => n.id === 'id-3');

      // id-1 has higher confidence, verified, more access count
      expect(node1.size).to.be.greaterThan(node3.size);
    });

    it('should assign colors by type', () => {
      const graph = buildKnowledgeGraph(sampleEntries);

      const solutionNode = graph.nodes.find(n => n.type === 'solution');
      const errorNode = graph.nodes.find(n => n.type === 'error');

      expect(solutionNode.color).to.equal('#27AE60'); // Green
      expect(errorNode.color).to.equal('#E74C3C'); // Red
    });

    it('should truncate long labels', () => {
      const longEntry = {
        id: 'long-1',
        type: 'solution',
        content: 'This is a very long content that should be truncated to fit in the node label because it is too long',
        confidence: 0.8,
        verified: false,
        accessCount: 0,
        tags: [],
        relatedIds: []
      };

      const graph = buildKnowledgeGraph([longEntry]);
      const node = graph.nodes[0];

      expect(node.label.length).to.be.at.most(50);
      expect(node.label).to.include('...');
    });
  });

  describe('exportGraph', () => {
    let graph;

    beforeEach(() => {
      graph = buildKnowledgeGraph(sampleEntries);
    });

    it('should export to JSON format', () => {
      const exported = exportGraph(graph, 'json');
      const parsed = JSON.parse(exported);

      expect(parsed).to.have.property('nodes');
      expect(parsed).to.have.property('edges');
      expect(parsed).to.have.property('stats');
    });

    it('should export to D3 format', () => {
      const exported = exportGraph(graph, 'd3');
      const parsed = JSON.parse(exported);

      expect(parsed).to.have.property('nodes');
      expect(parsed).to.have.property('links');
      expect(parsed.links[0]).to.have.property('source');
      expect(parsed.links[0]).to.have.property('target');
    });

    it('should export to Cytoscape format', () => {
      const exported = exportGraph(graph, 'cytoscape');
      const parsed = JSON.parse(exported);

      expect(parsed).to.have.property('elements');
      expect(parsed.elements).to.have.property('nodes');
      expect(parsed.elements).to.have.property('edges');
    });

    it('should export to DOT format', () => {
      const exported = exportGraph(graph, 'dot');

      expect(exported).to.include('digraph KnowledgeGraph');
      expect(exported).to.include('node [style=filled]');
      expect(exported).to.include('"id-1"');
      expect(exported).to.include('->');
    });

    it('should throw error for unsupported format', () => {
      expect(() => exportGraph(graph, 'invalid')).to.throw('Unsupported format');
    });
  });

  describe('findClusters', () => {
    it('should find connected components', () => {
      const graph = buildKnowledgeGraph(sampleEntries);
      const clusters = findClusters(graph);

      expect(clusters).to.have.length(2); // One cluster (id-1, id-2, id-3) and one isolated (id-4)

      const largestCluster = clusters.reduce((max, c) => c.length > max.length ? c : max, []);
      expect(largestCluster.length).to.equal(3);
    });

    it('should handle fully connected graph', () => {
      const connectedEntries = [
        { id: 'a', type: 'solution', content: 'A', confidence: 0.8, verified: false, accessCount: 0, tags: [], relatedIds: ['b'] },
        { id: 'b', type: 'error', content: 'B', confidence: 0.8, verified: false, accessCount: 0, tags: [], relatedIds: ['c'] },
        { id: 'c', type: 'pattern', content: 'C', confidence: 0.8, verified: false, accessCount: 0, tags: [], relatedIds: ['a'] }
      ];

      const graph = buildKnowledgeGraph(connectedEntries);
      const clusters = findClusters(graph);

      expect(clusters).to.have.length(1);
      expect(clusters[0]).to.have.length(3);
    });

    it('should handle fully disconnected graph', () => {
      const disconnectedEntries = [
        { id: 'a', type: 'solution', content: 'A', confidence: 0.8, verified: false, accessCount: 0, tags: [], relatedIds: [] },
        { id: 'b', type: 'error', content: 'B', confidence: 0.8, verified: false, accessCount: 0, tags: [], relatedIds: [] }
      ];

      const graph = buildKnowledgeGraph(disconnectedEntries);
      const clusters = findClusters(graph);

      expect(clusters).to.have.length(2);
      expect(clusters[0]).to.have.length(1);
      expect(clusters[1]).to.have.length(1);
    });
  });

  describe('getGraphStats', () => {
    it('should calculate comprehensive statistics', () => {
      const graph = buildKnowledgeGraph(sampleEntries);
      const stats = getGraphStats(graph);

      expect(stats).to.have.property('totalNodes', 4);
      expect(stats).to.have.property('totalEdges', 3);
      expect(stats).to.have.property('clusters', 2);
      expect(stats).to.have.property('largestCluster', 3);
      expect(stats).to.have.property('avgClusterSize');
      expect(stats).to.have.property('density');
    });

    it('should calculate graph density', () => {
      const graph = buildKnowledgeGraph(sampleEntries);
      const stats = getGraphStats(graph);

      // Density = edges / (nodes * (nodes - 1))
      const expectedDensity = 3 / (4 * 3);
      expect(stats.density).to.be.closeTo(expectedDensity, 0.01);
    });

    it('should handle empty graph', () => {
      const graph = buildKnowledgeGraph([]);
      const stats = getGraphStats(graph);

      expect(stats.totalNodes).to.equal(0);
      expect(stats.totalEdges).to.equal(0);
      expect(stats.clusters).to.equal(0);
      expect(stats.largestCluster).to.equal(0);
    });

    it('should calculate average cluster size', () => {
      const graph = buildKnowledgeGraph(sampleEntries);
      const stats = getGraphStats(graph);

      // Clusters: [3 nodes, 1 node] -> avg = 2
      expect(stats.avgClusterSize).to.equal(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle entry with no related IDs', () => {
      const entries = [
        { id: 'solo', type: 'insight', content: 'Solo', confidence: 0.8, verified: false, accessCount: 0, tags: [], relatedIds: [] }
      ];

      const graph = buildKnowledgeGraph(entries);

      expect(graph.nodes).to.have.length(1);
      expect(graph.edges).to.have.length(0);
      expect(graph.stats.isolatedNodes).to.equal(1);
    });

    it('should handle invalid relatedIds (non-existent)', () => {
      const entries = [
        { id: 'id-1', type: 'solution', content: 'Test', confidence: 0.8, verified: false, accessCount: 0, tags: [], relatedIds: ['non-existent'] }
      ];

      const graph = buildKnowledgeGraph(entries);

      expect(graph.edges).to.have.length(0); // Edge not created for non-existent target
    });

    it('should handle bidirectional relationships', () => {
      const entries = [
        { id: 'a', type: 'solution', content: 'A', confidence: 0.8, verified: false, accessCount: 0, tags: [], relatedIds: ['b'] },
        { id: 'b', type: 'error', content: 'B', confidence: 0.8, verified: false, accessCount: 0, tags: [], relatedIds: ['a'] }
      ];

      const graph = buildKnowledgeGraph(entries);

      expect(graph.edges).to.have.length(2); // Both directions
    });
  });
});
