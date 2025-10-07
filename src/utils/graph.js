/**
 * Knowledge Graph Builder
 * Creates graph representations of knowledge relationships
 */

/**
 * Build knowledge graph from entries
 * @param {Array} entries - Knowledge entries
 * @returns {Object} Graph structure with nodes and edges
 */
export function buildKnowledgeGraph(entries) {
  const nodes = [];
  const edges = [];
  const nodeMap = new Map();

  // Create nodes
  entries.forEach(entry => {
    const node = {
      id: entry.id,
      label: truncateText(entry.content, 50),
      type: entry.type,
      confidence: entry.confidence,
      verified: entry.verified,
      accessCount: entry.accessCount || 0,
      tags: entry.tags || [],
      // Metadata for visualization
      size: calculateNodeSize(entry),
      color: getNodeColor(entry.type),
      shape: getNodeShape(entry.type)
    };

    nodes.push(node);
    nodeMap.set(entry.id, node);
  });

  // Create edges from relationships
  entries.forEach(entry => {
    if (entry.relatedIds && entry.relatedIds.length > 0) {
      entry.relatedIds.forEach(targetId => {
        if (nodeMap.has(targetId)) {
          edges.push({
            from: entry.id,
            to: targetId,
            label: 'relates_to',
            arrows: 'to',
            color: { color: '#999999', opacity: 0.6 }
          });
        }
      });
    }
  });

  return {
    nodes,
    edges,
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodesByType: countByType(entries),
      isolatedNodes: nodes.filter(n =>
        !edges.some(e => e.from === n.id || e.to === n.id)
      ).length
    }
  };
}

/**
 * Export graph to various formats
 */
export function exportGraph(graph, format = 'json') {
  switch (format) {
    case 'json':
      return JSON.stringify(graph, null, 2);

    case 'cytoscape':
      return JSON.stringify({
        elements: {
          nodes: graph.nodes.map(n => ({ data: n })),
          edges: graph.edges.map(e => ({ data: e }))
        }
      }, null, 2);

    case 'dot':
      return exportToDot(graph);

    case 'd3':
      return JSON.stringify({
        nodes: graph.nodes,
        links: graph.edges.map(e => ({
          source: e.from,
          target: e.to,
          label: e.label
        }))
      }, null, 2);

    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Export to Graphviz DOT format
 */
function exportToDot(graph) {
  let dot = 'digraph KnowledgeGraph {\n';
  dot += '  node [style=filled];\n';

  // Add nodes
  graph.nodes.forEach(node => {
    const label = node.label.replace(/"/g, '\\"');
    const color = node.color;
    const shape = node.shape;
    dot += `  "${node.id}" [label="${label}", fillcolor="${color}", shape=${shape}];\n`;
  });

  // Add edges
  graph.edges.forEach(edge => {
    dot += `  "${edge.from}" -> "${edge.to}" [label="${edge.label}"];\n`;
  });

  dot += '}\n';
  return dot;
}

/**
 * Calculate node size based on importance
 */
function calculateNodeSize(entry) {
  const baseSize = 20;
  const confidenceBonus = entry.confidence * 20;
  const accessBonus = Math.min(entry.accessCount || 0, 10) * 2;
  const verifiedBonus = entry.verified ? 10 : 0;

  return baseSize + confidenceBonus + accessBonus + verifiedBonus;
}

/**
 * Get node color by type
 */
function getNodeColor(type) {
  const colors = {
    decision: '#4A90E2',    // Blue
    error: '#E74C3C',       // Red
    solution: '#27AE60',    // Green
    pattern: '#9B59B6',     // Purple
    insight: '#F39C12'      // Orange
  };

  return colors[type] || '#95A5A6';  // Gray default
}

/**
 * Get node shape by type
 */
function getNodeShape(type) {
  const shapes = {
    decision: 'diamond',
    error: 'box',
    solution: 'ellipse',
    pattern: 'hexagon',
    insight: 'star'
  };

  return shapes[type] || 'dot';
}

/**
 * Truncate text for labels
 */
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Count entries by type
 */
function countByType(entries) {
  const counts = {};
  entries.forEach(entry => {
    counts[entry.type] = (counts[entry.type] || 0) + 1;
  });
  return counts;
}

/**
 * Find clusters in graph using simple connected components
 */
export function findClusters(graph) {
  const visited = new Set();
  const clusters = [];

  graph.nodes.forEach(node => {
    if (!visited.has(node.id)) {
      const cluster = [];
      exploreCluster(node.id, graph, visited, cluster);
      if (cluster.length > 0) {
        clusters.push(cluster);
      }
    }
  });

  return clusters;
}

/**
 * DFS to explore connected component
 */
function exploreCluster(nodeId, graph, visited, cluster) {
  if (visited.has(nodeId)) return;

  visited.add(nodeId);
  cluster.push(nodeId);

  // Find all connected nodes
  graph.edges.forEach(edge => {
    if (edge.from === nodeId && !visited.has(edge.to)) {
      exploreCluster(edge.to, graph, visited, cluster);
    }
    if (edge.to === nodeId && !visited.has(edge.from)) {
      exploreCluster(edge.from, graph, visited, cluster);
    }
  });
}

/**
 * Get graph statistics
 */
export function getGraphStats(graph) {
  const clusters = findClusters(graph);

  return {
    ...graph.stats,
    clusters: clusters.length,
    largestCluster: Math.max(...clusters.map(c => c.length), 0),
    avgClusterSize: clusters.length > 0
      ? clusters.reduce((sum, c) => sum + c.length, 0) / clusters.length
      : 0,
    density: graph.nodes.length > 1
      ? graph.edges.length / (graph.nodes.length * (graph.nodes.length - 1))
      : 0
  };
}
