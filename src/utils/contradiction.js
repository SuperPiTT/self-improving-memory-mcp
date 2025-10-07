/**
 * Contradiction Detection Module
 * Detects semantic conflicts in knowledge base and resolves them based on confidence
 */

import { cosineSimilarity } from './embeddings.js';

/**
 * Detect contradictions between knowledge entries
 * @param {Array} entries - All knowledge entries with embeddings
 * @param {Object} options - Detection options
 * @returns {Array} Array of detected contradictions
 */
export async function detectContradictions(entries, options = {}) {
  const {
    similarityThreshold = 0.85, // High similarity = potential contradiction
    minConfidenceDelta = 0.1,   // Minimum confidence difference to matter
    sameTypeOnly = false         // Only check within same type
  } = options;

  const contradictions = [];

  // Compare all pairs of entries
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const entry1 = entries[i];
      const entry2 = entries[j];

      // Skip if different types and sameTypeOnly is true
      if (sameTypeOnly && entry1.type !== entry2.type) {
        continue;
      }

      // Skip if entries are related (not contradictory)
      if (areRelated(entry1, entry2)) {
        continue;
      }

      // Check semantic similarity
      if (entry1.embedding && entry2.embedding) {
        const similarity = cosineSimilarity(entry1.embedding, entry2.embedding);

        // High similarity but different confidence suggests potential conflict
        if (similarity >= similarityThreshold) {
          const confidenceDelta = Math.abs(entry1.confidence - entry2.confidence);

          // Only flag if there's meaningful confidence difference
          if (confidenceDelta >= minConfidenceDelta) {
            contradictions.push({
              entry1: entry1.id,
              entry2: entry2.id,
              similarity,
              confidenceDelta,
              winner: entry1.confidence > entry2.confidence ? entry1.id : entry2.id,
              loser: entry1.confidence > entry2.confidence ? entry2.id : entry1.id,
              reason: determineContradictionReason(entry1, entry2, similarity, confidenceDelta)
            });
          }
        }
      }
    }
  }

  return contradictions;
}

/**
 * Check if two entries are related (not contradictory)
 */
function areRelated(entry1, entry2) {
  return (
    entry1.relatedIds?.includes(entry2.id) ||
    entry2.relatedIds?.includes(entry1.id)
  );
}

/**
 * Determine the reason for contradiction
 */
function determineContradictionReason(entry1, entry2, similarity, confidenceDelta) {
  const reasons = [];

  if (similarity > 0.95) {
    reasons.push('Nearly identical content');
  } else if (similarity > 0.85) {
    reasons.push('Highly similar content');
  }

  if (confidenceDelta > 0.3) {
    reasons.push('Large confidence difference');
  } else if (confidenceDelta > 0.1) {
    reasons.push('Moderate confidence difference');
  }

  if (entry1.verified !== entry2.verified) {
    reasons.push('Different verification status');
  }

  if (entry1.type !== entry2.type) {
    reasons.push(`Different types (${entry1.type} vs ${entry2.type})`);
  }

  return reasons.join(', ');
}

/**
 * Resolve contradiction by marking lower-confidence entry as superseded
 * @param {Object} vectorStore - VectorStore instance
 * @param {Object} contradiction - Contradiction object
 * @returns {Object} Resolution result
 */
export async function resolveContradiction(vectorStore, contradiction) {
  const winner = await vectorStore.getById(contradiction.winner);
  const loser = await vectorStore.getById(contradiction.loser);

  if (!winner || !loser) {
    throw new Error('Cannot resolve: one or both entries not found');
  }

  // Mark loser as superseded
  const resolution = {
    resolvedAt: Date.now(),
    supersededBy: winner.id,
    supersededReason: contradiction.reason,
    originalConfidence: loser.confidence,
    similarity: contradiction.similarity
  };

  // Update loser with superseded information
  await vectorStore.updateMetadata(loser.id, {
    superseded: true,
    supersededBy: winner.id,
    supersededAt: resolution.resolvedAt,
    supersededReason: resolution.supersededReason,
    confidence: Math.max(0.1, loser.confidence - 0.3) // Reduce confidence
  });

  // Add to winner's history
  if (!winner.supersedes) {
    winner.supersedes = [];
  }
  winner.supersedes.push({
    id: loser.id,
    reason: contradiction.reason,
    resolvedAt: resolution.resolvedAt
  });

  await vectorStore.updateMetadata(winner.id, {
    supersedes: winner.supersedes
  });

  return {
    resolution,
    winner: winner.id,
    loser: loser.id,
    action: 'superseded'
  };
}

/**
 * Auto-resolve all contradictions in knowledge base
 * @param {Object} vectorStore - VectorStore instance
 * @param {Object} options - Detection and resolution options
 * @returns {Object} Resolution summary
 */
export async function autoResolveContradictions(vectorStore, options = {}) {
  const entries = await vectorStore.getAllEntries();

  // Only consider entries that aren't already superseded
  const activeEntries = entries.filter(e => !e.superseded);

  const contradictions = await detectContradictions(activeEntries, options);

  const resolutions = [];
  const errors = [];

  for (const contradiction of contradictions) {
    try {
      const result = await resolveContradiction(vectorStore, contradiction);
      resolutions.push(result);
    } catch (error) {
      errors.push({
        contradiction,
        error: error.message
      });
    }
  }

  return {
    detected: contradictions.length,
    resolved: resolutions.length,
    failed: errors.length,
    resolutions,
    errors
  };
}

/**
 * Get superseded entries (historical tracking)
 * @param {Object} vectorStore - VectorStore instance
 * @returns {Array} Superseded entries with their superseding entries
 */
export async function getSupersededHistory(vectorStore) {
  const entries = await vectorStore.getAllEntries();

  const superseded = entries
    .filter(e => e.superseded)
    .map(entry => ({
      id: entry.id,
      content: entry.content,
      type: entry.type,
      originalConfidence: entry.originalConfidence || entry.confidence,
      currentConfidence: entry.confidence,
      supersededBy: entry.supersededBy,
      supersededAt: entry.supersededAt,
      supersededReason: entry.supersededReason
    }));

  // Attach superseding entry details
  for (const item of superseded) {
    if (item.supersededBy) {
      const winner = await vectorStore.getById(item.supersededBy);
      if (winner) {
        item.supersededByEntry = {
          id: winner.id,
          content: winner.content,
          type: winner.type,
          confidence: winner.confidence
        };
      }
    }
  }

  return superseded;
}

/**
 * Find entries that may contradict a new entry before saving
 * @param {Object} vectorStore - VectorStore instance
 * @param {string} content - New entry content
 * @param {Array} embedding - New entry embedding
 * @param {number} threshold - Similarity threshold
 * @returns {Array} Potentially conflicting entries
 */
export async function findPotentialConflicts(vectorStore, content, embedding, threshold = 0.85) {
  const entries = await vectorStore.getAllEntries();
  const activeEntries = entries.filter(e => !e.superseded);

  const conflicts = [];

  for (const entry of activeEntries) {
    if (entry.embedding) {
      const similarity = cosineSimilarity(embedding, entry.embedding);

      if (similarity >= threshold) {
        conflicts.push({
          entry,
          similarity,
          recommendation: similarity > 0.95
            ? 'Consider updating existing entry instead of creating new one'
            : 'Review for potential contradiction'
        });
      }
    }
  }

  return conflicts.sort((a, b) => b.similarity - a.similarity);
}
