/**
 * Pattern Emergence & Analysis Module
 * Detects emerging patterns, clusters, and generates insights from knowledge base
 */

import { cosineSimilarity } from './embeddings.js';

/**
 * Cluster knowledge entries using hierarchical clustering
 * @param {Array} entries - Knowledge entries with embeddings
 * @param {Object} options - Clustering options
 * @returns {Array} Array of clusters
 */
export function clusterEntries(entries, options = {}) {
  const {
    similarityThreshold = 0.75,  // Minimum similarity to be in same cluster
    minClusterSize = 2,           // Minimum entries per cluster
    maxClusters = 10              // Maximum number of clusters to return
  } = options;

  if (entries.length === 0) return [];

  // Filter entries with embeddings
  const validEntries = entries.filter(e => e.embedding && e.embedding.length > 0);
  if (validEntries.length === 0) return [];

  const clusters = [];
  const assigned = new Set();

  // Sort by access count (most accessed first) to prioritize important entries
  const sortedEntries = [...validEntries].sort((a, b) =>
    (b.accessCount || 0) - (a.accessCount || 0)
  );

  for (const entry of sortedEntries) {
    if (assigned.has(entry.id)) continue;

    const cluster = {
      centroid: entry,
      entries: [entry],
      avgConfidence: entry.confidence,
      avgAccessCount: entry.accessCount || 0,
      types: new Set([entry.type]),
      tags: new Set(entry.tags || [])
    };

    assigned.add(entry.id);

    // Find similar entries
    for (const candidate of sortedEntries) {
      if (assigned.has(candidate.id)) continue;

      const similarity = cosineSimilarity(entry.embedding, candidate.embedding);

      if (similarity >= similarityThreshold) {
        cluster.entries.push(candidate);
        cluster.types.add(candidate.type);
        (candidate.tags || []).forEach(tag => cluster.tags.add(tag));
        assigned.add(candidate.id);
      }
    }

    // Only add cluster if it meets minimum size
    if (cluster.entries.length >= minClusterSize) {
      // Calculate cluster statistics
      cluster.avgConfidence = cluster.entries.reduce((sum, e) => sum + e.confidence, 0) / cluster.entries.length;
      cluster.avgAccessCount = cluster.entries.reduce((sum, e) => sum + (e.accessCount || 0), 0) / cluster.entries.length;
      cluster.types = Array.from(cluster.types);
      cluster.tags = Array.from(cluster.tags);
      cluster.size = cluster.entries.length;

      clusters.push(cluster);
    }

    // Stop if we reached max clusters
    if (clusters.length >= maxClusters) break;
  }

  // Sort clusters by size (largest first)
  clusters.sort((a, b) => b.size - a.size);

  return clusters;
}

/**
 * Analyze frequency patterns in knowledge base
 * @param {Array} entries - All knowledge entries
 * @returns {Object} Frequency analysis results
 */
export function analyzeFrequency(entries) {
  const analysis = {
    errorPatterns: [],
    decisionPatterns: [],
    tagFrequency: {},
    typeDistribution: {},
    temporalPatterns: [],
    confidenceTrends: []
  };

  // Error patterns - group by similar errors
  const errors = entries.filter(e => e.type === 'error');
  const errorsByContent = {};

  errors.forEach(error => {
    const key = error.content.toLowerCase().substring(0, 50); // First 50 chars as key
    if (!errorsByContent[key]) {
      errorsByContent[key] = {
        pattern: error.content,
        count: 0,
        firstSeen: error.timestamp,
        lastSeen: error.timestamp,
        avgConfidence: 0,
        examples: []
      };
    }
    errorsByContent[key].count++;
    errorsByContent[key].lastSeen = Math.max(errorsByContent[key].lastSeen, error.timestamp);
    errorsByContent[key].examples.push(error.id);
  });

  analysis.errorPatterns = Object.values(errorsByContent)
    .filter(p => p.count >= 2) // Only recurring errors
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10

  // Decision patterns - frequently made decisions
  const decisions = entries.filter(e => e.type === 'decision');
  const decisionsByContent = {};

  decisions.forEach(decision => {
    const key = decision.content.toLowerCase().substring(0, 50);
    if (!decisionsByContent[key]) {
      decisionsByContent[key] = {
        pattern: decision.content,
        count: 0,
        avgConfidence: 0,
        examples: []
      };
    }
    decisionsByContent[key].count++;
    decisionsByContent[key].examples.push(decision.id);
  });

  analysis.decisionPatterns = Object.values(decisionsByContent)
    .filter(p => p.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Tag frequency
  entries.forEach(entry => {
    (entry.tags || []).forEach(tag => {
      analysis.tagFrequency[tag] = (analysis.tagFrequency[tag] || 0) + 1;
    });
  });

  // Type distribution
  entries.forEach(entry => {
    analysis.typeDistribution[entry.type] = (analysis.typeDistribution[entry.type] || 0) + 1;
  });

  // Temporal patterns - entries created over time
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const last7Days = entries.filter(e => e.timestamp > now - 7 * dayMs).length;
  const last30Days = entries.filter(e => e.timestamp > now - 30 * dayMs).length;
  const last90Days = entries.filter(e => e.timestamp > now - 90 * dayMs).length;

  analysis.temporalPatterns = {
    last7Days,
    last30Days,
    last90Days,
    avgPerDay: last30Days / 30,
    trend: last7Days > (last30Days / 30) * 7 ? 'increasing' : 'decreasing'
  };

  // Confidence trends by type
  const confidenceByType = {};
  entries.forEach(entry => {
    if (!confidenceByType[entry.type]) {
      confidenceByType[entry.type] = [];
    }
    confidenceByType[entry.type].push(entry.confidence);
  });

  analysis.confidenceTrends = Object.entries(confidenceByType).map(([type, confidences]) => ({
    type,
    avg: confidences.reduce((sum, c) => sum + c, 0) / confidences.length,
    min: Math.min(...confidences),
    max: Math.max(...confidences),
    count: confidences.length
  }));

  return analysis;
}

/**
 * Generate insights from clusters and frequency analysis
 * @param {Array} clusters - Detected clusters
 * @param {Object} frequencyAnalysis - Frequency analysis results
 * @param {Array} entries - All entries
 * @returns {Array} Array of insights
 */
export function generateInsights(clusters, frequencyAnalysis, entries) {
  const insights = [];

  // Insight 1: Large clusters indicate common themes
  clusters.forEach((cluster, idx) => {
    if (cluster.size >= 5) {
      insights.push({
        type: 'cluster',
        priority: 'high',
        title: `Common theme detected: ${cluster.centroid.content.substring(0, 50)}...`,
        description: `Found ${cluster.size} related entries with ${(cluster.avgConfidence * 100).toFixed(0)}% avg confidence`,
        recommendation: `Consider creating a reusable pattern or abstraction for this common theme`,
        data: {
          clusterSize: cluster.size,
          types: cluster.types,
          tags: cluster.tags.slice(0, 5)
        }
      });
    }
  });

  // Insight 2: Recurring errors
  if (frequencyAnalysis.errorPatterns.length > 0) {
    const topError = frequencyAnalysis.errorPatterns[0];
    if (topError.count >= 3) {
      insights.push({
        type: 'error',
        priority: 'critical',
        title: `Recurring error: ${topError.pattern.substring(0, 60)}...`,
        description: `This error has occurred ${topError.count} times`,
        recommendation: 'Investigate root cause and implement permanent fix',
        data: {
          count: topError.count,
          firstSeen: new Date(topError.firstSeen).toISOString(),
          lastSeen: new Date(topError.lastSeen).toISOString()
        }
      });
    }
  }

  // Insight 3: Knowledge growth trends
  if (frequencyAnalysis.temporalPatterns.trend === 'increasing') {
    insights.push({
      type: 'trend',
      priority: 'medium',
      title: 'Knowledge base growing rapidly',
      description: `${frequencyAnalysis.temporalPatterns.last7Days} entries added in last 7 days (${frequencyAnalysis.temporalPatterns.avgPerDay.toFixed(1)}/day average)`,
      recommendation: 'Consider organizing knowledge with more tags and categories',
      data: frequencyAnalysis.temporalPatterns
    });
  }

  // Insight 4: Low confidence patterns
  const lowConfidenceTypes = (frequencyAnalysis.confidenceTrends || [])
    .filter(t => t.avg < 0.6)
    .sort((a, b) => a.avg - b.avg);

  if (lowConfidenceTypes.length > 0) {
    const lowestType = lowConfidenceTypes[0];
    insights.push({
      type: 'quality',
      priority: 'medium',
      title: `Low confidence in ${lowestType.type} entries`,
      description: `Average confidence only ${(lowestType.avg * 100).toFixed(0)}% for ${lowestType.count} ${lowestType.type} entries`,
      recommendation: 'Review and verify these entries, or remove unreliable knowledge',
      data: lowestType
    });
  }

  // Insight 5: Underutilized knowledge
  const unusedEntries = entries.filter(e => (e.accessCount || 0) === 0);
  if (unusedEntries.length > entries.length * 0.3) {
    insights.push({
      type: 'usage',
      priority: 'low',
      title: 'Many entries never accessed',
      description: `${unusedEntries.length} of ${entries.length} entries (${((unusedEntries.length / entries.length) * 100).toFixed(0)}%) have never been accessed`,
      recommendation: 'Consider archiving or improving discoverability of unused knowledge',
      data: {
        unusedCount: unusedEntries.length,
        totalCount: entries.length,
        percentage: (unusedEntries.length / entries.length) * 100
      }
    });
  }

  // Insight 6: Tag suggestions based on clusters
  const clusterTags = new Set();
  clusters.forEach(cluster => {
    cluster.tags.forEach(tag => clusterTags.add(tag));
  });

  const allTags = new Set();
  entries.forEach(entry => {
    (entry.tags || []).forEach(tag => allTags.add(tag));
  });

  if (clusterTags.size > 0 && allTags.size > 0) {
    const commonTags = Array.from(clusterTags).filter(tag =>
      (frequencyAnalysis.tagFrequency[tag] || 0) >= 3
    );

    if (commonTags.length > 0) {
      insights.push({
        type: 'organization',
        priority: 'low',
        title: 'Frequently used tags detected',
        description: `Tags ${commonTags.slice(0, 3).join(', ')} are used frequently across clusters`,
        recommendation: 'Consider creating dedicated categories for these common themes',
        data: {
          tags: commonTags,
          frequencies: commonTags.map(tag => ({ tag, count: frequencyAnalysis.tagFrequency[tag] }))
        }
      });
    }
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return insights;
}

/**
 * Detect anti-patterns in knowledge base
 * @param {Array} entries - All knowledge entries
 * @param {Object} frequencyAnalysis - Frequency analysis
 * @returns {Array} Detected anti-patterns
 */
export function detectAntiPatterns(entries, frequencyAnalysis) {
  const antiPatterns = [];

  // Anti-pattern 1: Duplicate or near-duplicate entries
  const contentMap = {};
  entries.forEach(entry => {
    const key = entry.content.toLowerCase().trim().substring(0, 100);
    if (!contentMap[key]) {
      contentMap[key] = [];
    }
    contentMap[key].push(entry);
  });

  const duplicates = Object.values(contentMap).filter(group => group.length > 1);
  if (duplicates.length > 0) {
    antiPatterns.push({
      type: 'duplication',
      severity: 'medium',
      title: 'Duplicate entries detected',
      description: `Found ${duplicates.length} groups of similar entries`,
      recommendation: 'Consolidate duplicate entries to maintain clean knowledge base',
      affectedEntries: duplicates.flat().map(e => e.id)
    });
  }

  // Anti-pattern 2: Too many low-confidence entries
  const lowConfidence = entries.filter(e => e.confidence < 0.5);
  if (lowConfidence.length > entries.length * 0.2) {
    antiPatterns.push({
      type: 'low_quality',
      severity: 'high',
      title: 'Excessive low-confidence entries',
      description: `${lowConfidence.length} entries have confidence < 50%`,
      recommendation: 'Review and improve or remove low-confidence knowledge',
      affectedEntries: lowConfidence.map(e => e.id)
    });
  }

  // Anti-pattern 3: Untagged entries
  const untagged = entries.filter(e => !e.tags || e.tags.length === 0);
  if (untagged.length > entries.length * 0.3) {
    antiPatterns.push({
      type: 'organization',
      severity: 'low',
      title: 'Many untagged entries',
      description: `${untagged.length} entries have no tags`,
      recommendation: 'Add tags to improve searchability and organization',
      affectedEntries: untagged.map(e => e.id).slice(0, 10) // Sample
    });
  }

  // Anti-pattern 4: Errors without solutions
  const errors = entries.filter(e => e.type === 'error');
  const solutions = entries.filter(e => e.type === 'solution');
  const errorsWithoutSolutions = errors.filter(error => {
    const linkedSolution = solutions.find(sol =>
      error.relatedIds?.includes(sol.id) || sol.relatedIds?.includes(error.id)
    );
    return !linkedSolution;
  });

  if (errorsWithoutSolutions.length > errors.length * 0.5 && errors.length > 0) {
    antiPatterns.push({
      type: 'incomplete',
      severity: 'medium',
      title: 'Errors without solutions',
      description: `${errorsWithoutSolutions.length} errors have no linked solution`,
      recommendation: 'Link solutions to errors or document that they are unresolved',
      affectedEntries: errorsWithoutSolutions.map(e => e.id).slice(0, 10)
    });
  }

  return antiPatterns;
}

/**
 * Suggest new tags based on clustering and content analysis
 * @param {Array} clusters - Detected clusters
 * @param {Array} entries - All entries
 * @returns {Array} Tag suggestions
 */
export function suggestTags(clusters, entries) {
  const suggestions = [];

  clusters.forEach((cluster, idx) => {
    // Extract common words from cluster content
    const words = new Map();

    cluster.entries.forEach(entry => {
      const contentWords = entry.content
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3 && !['this', 'that', 'with', 'from', 'have'].includes(w));

      contentWords.forEach(word => {
        words.set(word, (words.get(word) || 0) + 1);
      });
    });

    // Find most common words
    const commonWords = Array.from(words.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);

    if (commonWords.length > 0 && cluster.size >= 3) {
      suggestions.push({
        suggestedTag: commonWords[0],
        clusterSize: cluster.size,
        confidence: cluster.avgConfidence,
        reason: `Found in ${cluster.size} related entries`,
        alternativeTags: commonWords.slice(1),
        affectedEntries: cluster.entries.map(e => e.id)
      });
    }
  });

  return suggestions;
}
