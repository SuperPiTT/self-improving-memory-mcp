/**
 * KnowledgeStore - High-level API for managing knowledge entries
 * Wraps VectorStore with business logic for knowledge management
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { VectorStore } from './vector-store.js';
import { buildKnowledgeGraph, exportGraph, getGraphStats } from './utils/graph.js';
import {
  detectContradictions,
  resolveContradiction,
  autoResolveContradictions,
  getSupersededHistory,
  findPotentialConflicts
} from './utils/contradiction.js';
import {
  clusterEntries,
  analyzeFrequency,
  generateInsights,
  detectAntiPatterns,
  suggestTags
} from './utils/patterns.js';

/**
 * @typedef {Object} KnowledgeEntry
 * @property {string} id
 * @property {'decision'|'error'|'solution'|'pattern'|'insight'} type
 * @property {string} content
 * @property {string} [context]
 * @property {number} confidence - 0-1
 * @property {boolean} verified
 * @property {string[]} tags
 * @property {number} timestamp
 * @property {number} [lastAccessed]
 * @property {number} accessCount
 * @property {string[]} relatedIds
 */

export class KnowledgeStore {
  constructor(projectPath) {
    this.memoryPath = path.join(projectPath, '.claude-memory');
    this.vectorStore = new VectorStore(this.memoryPath);
  }

  async initialize() {
    try {
      await fs.mkdir(this.memoryPath, { recursive: true });
      await this.vectorStore.initialize();

      // Warm-up en background
      this.vectorStore.warmUp().catch(err => {
        console.error('Vector warm-up failed (non-critical):', err.message);
      });
    } catch (error) {
      console.error('Error initializing knowledge store:', error);
    }
  }

  /**
   * Agregar nueva entrada
   */
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

  /**
   * Actualizar entrada existente
   */
  async updateEntry(id, updates) {
    const existing = await this.vectorStore.getById(id);
    if (!existing) throw new Error(`Entry ${id} not found`);

    const updated = { ...existing, ...updates };

    // Si content o context cambiaron, re-embedear
    if (updates.content || updates.context) {
      const text = `${updated.content} ${updated.context || ''}`;
      await this.vectorStore.updateVector(id, text, updated);
    } else {
      // Solo metadata cambió
      await this.vectorStore.updateMetadata(id, updated);
    }
  }

  /**
   * Búsqueda semántica con vector search
   */
  async search(query, filters = {}) {
    const results = await this.vectorStore.search(query, 10, filters);

    // Actualizar accessCount para cada resultado
    for (const result of results) {
      result.lastAccessed = Date.now();
      result.accessCount = (result.accessCount || 0) + 1;

      // Actualizar metadata en VectorDB
      await this.vectorStore.updateMetadata(result.id, {
        lastAccessed: result.lastAccessed,
        accessCount: result.accessCount,
      });
    }

    return results;
  }

  /**
   * Obtener entrada por ID
   */
  async getById(id) {
    return await this.vectorStore.getById(id);
  }

  /**
   * Eliminar entrada
   */
  async deleteEntry(id) {
    await this.vectorStore.deleteVector(id);
  }

  /**
   * Vincular entradas relacionadas
   */
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

  /**
   * Obtener estadísticas (incluye métricas de performance)
   */
  async getStats() {
    const allEntries = await this.vectorStore.getAllEntries();
    const perfMetrics = this.vectorStore.getPerformanceMetrics();

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
      performance: perfMetrics
    };
  }

  /**
   * Exportar a Markdown
   */
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

  /**
   * Build knowledge graph
   * @returns {Object} Graph structure with nodes and edges
   */
  async buildGraph() {
    const entries = await this.vectorStore.getAllEntries();
    return buildKnowledgeGraph(entries);
  }

  /**
   * Export knowledge graph
   * @param {string} format - Export format (json, cytoscape, dot, d3)
   * @returns {Promise<string>} Exported graph data
   */
  async exportGraph(format = 'json') {
    const graph = await this.buildGraph();
    return exportGraph(graph, format);
  }

  /**
   * Export graph visualization to HTML
   * @returns {Promise<string>} Path to HTML file
   */
  async exportGraphVisualization() {
    const graph = await this.buildGraph();
    const stats = getGraphStats(graph);
    const graphData = exportGraph(graph, 'd3');

    const htmlPath = path.join(this.memoryPath, 'knowledge-graph.html');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Knowledge Graph Visualization</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
    }
    .stats {
      background: white;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2 px 4px rgba(0,0,0,0.1);
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }
    .stat-item {
      padding: 10px;
      background: #f8f9fa;
      border-radius: 4px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #4A90E2;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }
    svg {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .node {
      cursor: pointer;
      stroke: #fff;
      stroke-width: 2px;
    }
    .link {
      stroke: #999;
      stroke-opacity: 0.6;
      stroke-width: 1px;
    }
    .node-label {
      font-size: 10px;
      pointer-events: none;
      text-anchor: middle;
      fill: #333;
    }
    .legend {
      background: white;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .legend-item {
      display: inline-flex;
      align-items: center;
      margin-right: 20px;
      margin-bottom: 10px;
    }
    .legend-color {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      margin-right: 8px;
    }
    .tooltip {
      position: absolute;
      padding: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      border-radius: 4px;
      pointer-events: none;
      font-size: 12px;
      opacity: 0;
      transition: opacity 0.2s;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Knowledge Graph Visualization</h1>

    <div class="stats">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${stats.totalNodes}</div>
          <div class="stat-label">Total Nodes</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.totalEdges}</div>
          <div class="stat-label">Total Edges</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.clusters}</div>
          <div class="stat-label">Clusters</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.largestCluster}</div>
          <div class="stat-label">Largest Cluster</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${(stats.density * 100).toFixed(1)}%</div>
          <div class="stat-label">Graph Density</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.isolatedNodes}</div>
          <div class="stat-label">Isolated Nodes</div>
        </div>
      </div>
    </div>

    <svg id="graph" width="1400" height="800"></svg>

    <div class="legend">
      <div class="legend-item">
        <div class="legend-color" style="background: #4A90E2"></div>
        <span>Decision</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #E74C3C"></div>
        <span>Error</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #27AE60"></div>
        <span>Solution</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #9B59B6"></div>
        <span>Pattern</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #F39C12"></div>
        <span>Insight</span>
      </div>
    </div>

    <div class="tooltip" id="tooltip"></div>
  </div>

  <script>
    const data = ${graphData};

    const width = 1400;
    const height = 800;

    const svg = d3.select("#graph");
    const tooltip = d3.select("#tooltip");

    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => d.size + 5));

    const link = svg.append("g")
      .selectAll("line")
      .data(data.links)
      .enter()
      .append("line")
      .attr("class", "link");

    const node = svg.append("g")
      .selectAll("circle")
      .data(data.nodes)
      .enter()
      .append("circle")
      .attr("class", "node")
      .attr("r", d => d.size / 2)
      .attr("fill", d => d.color)
      .on("mouseover", function(event, d) {
        tooltip
          .style("opacity", 1)
          .html(\`
            <strong>\${d.label}</strong><br>
            Type: \${d.type}<br>
            Confidence: \${(d.confidence * 100).toFixed(0)}%<br>
            Access: \${d.accessCount}<br>
            Tags: \${d.tags.join(', ')}
          \`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function() {
        tooltip.style("opacity", 0);
      })
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    const label = svg.append("g")
      .selectAll("text")
      .data(data.nodes)
      .enter()
      .append("text")
      .attr("class", "node-label")
      .text(d => d.label.substring(0, 30));

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      label
        .attr("x", d => d.x)
        .attr("y", d => d.y + 4);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  </script>
</body>
</html>`;

    await fs.writeFile(htmlPath, html);
    return htmlPath;
  }

  /**
   * Detect contradictions in knowledge base
   * @param {Object} options - Detection options
   * @returns {Promise<Array>} Array of contradictions
   */
  async detectContradictions(options = {}) {
    const entries = await this.vectorStore.getAllEntries();
    return await detectContradictions(entries, options);
  }

  /**
   * Resolve a specific contradiction
   * @param {Object} contradiction - Contradiction to resolve
   * @returns {Promise<Object>} Resolution result
   */
  async resolveContradiction(contradiction) {
    return await resolveContradiction(this.vectorStore, contradiction);
  }

  /**
   * Auto-resolve all contradictions
   * @param {Object} options - Detection and resolution options
   * @returns {Promise<Object>} Resolution summary
   */
  async autoResolveContradictions(options = {}) {
    return await autoResolveContradictions(this.vectorStore, options);
  }

  /**
   * Get history of superseded knowledge
   * @returns {Promise<Array>} Superseded entries
   */
  async getSupersededHistory() {
    return await getSupersededHistory(this.vectorStore);
  }

  /**
   * Find potential conflicts before adding new entry
   * @param {string} content - New entry content
   * @param {Array} embedding - New entry embedding
   * @param {number} threshold - Similarity threshold
   * @returns {Promise<Array>} Potentially conflicting entries
   */
  async findPotentialConflicts(content, embedding, threshold = 0.85) {
    return await findPotentialConflicts(this.vectorStore, content, embedding, threshold);
  }

  /**
   * Cluster knowledge entries by semantic similarity
   * @param {Object} options - Clustering options
   * @returns {Promise<Array>} Array of clusters
   */
  async clusterKnowledge(options = {}) {
    const entries = await this.vectorStore.getAllEntries();
    return clusterEntries(entries, options);
  }

  /**
   * Analyze frequency patterns
   * @returns {Promise<Object>} Frequency analysis results
   */
  async analyzePatterns() {
    const entries = await this.vectorStore.getAllEntries();
    return analyzeFrequency(entries);
  }

  /**
   * Generate insights from knowledge base
   * @param {Object} options - Options for insight generation
   * @returns {Promise<Object>} Insights and recommendations
   */
  async generateInsights(options = {}) {
    const entries = await this.vectorStore.getAllEntries();
    const clusters = await this.clusterKnowledge(options);
    const frequencyAnalysis = analyzeFrequency(entries);
    const insights = generateInsights(clusters, frequencyAnalysis, entries);
    const antiPatterns = detectAntiPatterns(entries, frequencyAnalysis);
    const tagSuggestions = suggestTags(clusters, entries);

    return {
      insights,
      antiPatterns,
      tagSuggestions,
      clusters: clusters.map(c => ({
        size: c.size,
        types: c.types,
        tags: c.tags,
        avgConfidence: c.avgConfidence,
        centroid: {
          id: c.centroid.id,
          content: c.centroid.content.substring(0, 100)
        }
      })),
      summary: {
        totalInsights: insights.length,
        criticalInsights: insights.filter(i => i.priority === 'critical').length,
        antiPatternsFound: antiPatterns.length,
        clustersDetected: clusters.length,
        tagSuggestionsCount: tagSuggestions.length
      }
    };
  }

  /**
   * Detect anti-patterns in knowledge base
   * @returns {Promise<Array>} Detected anti-patterns
   */
  async detectAntiPatterns() {
    const entries = await this.vectorStore.getAllEntries();
    const frequencyAnalysis = analyzeFrequency(entries);
    return detectAntiPatterns(entries, frequencyAnalysis);
  }

  /**
   * Get tag suggestions based on clustering
   * @param {Object} options - Clustering options
   * @returns {Promise<Array>} Tag suggestions
   */
  async suggestTags(options = {}) {
    const entries = await this.vectorStore.getAllEntries();
    const clusters = clusterEntries(entries, options);
    return suggestTags(clusters, entries);
  }
}
