# API Reference

Complete API documentation for the Self-Improving Memory MCP Server.

---

## Table of Contents

- [MCP Tools](#mcp-tools)
  - [save_knowledge](#save_knowledge)
  - [search_knowledge](#search_knowledge)
  - [link_knowledge](#link_knowledge)
  - [get_stats](#get_stats)
  - [export_markdown](#export_markdown)
- [JavaScript API](#javascript-api)
  - [KnowledgeStore](#knowledgestore)
  - [VectorStore](#vectorstore)
  - [Performance Monitoring](#performance-monitoring)
- [Data Models](#data-models)
- [Error Handling](#error-handling)

---

## MCP Tools

### save_knowledge

Save a piece of knowledge with semantic embeddings.

**Input Schema:**

```json
{
  "type": "string",         // Required: "decision" | "error" | "solution" | "pattern" | "insight"
  "content": "string",      // Required: The knowledge content
  "context": "string",      // Optional: Additional context or reasoning
  "confidence": "number",   // Required: 0-1 confidence score
  "verified": "boolean",    // Optional: Has this been verified? (default: false)
  "tags": ["string"]        // Required: Searchable tags
}
```

**Example:**

```javascript
{
  "type": "solution",
  "content": "Use retry with exponential backoff for API calls",
  "context": "Fixes intermittent network errors in production",
  "confidence": 0.9,
  "verified": true,
  "tags": ["api", "resilience", "networking"]
}
```

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "Knowledge saved with ID: 550e8400-e29b-41d4-a716-446655440000"
  }]
}
```

**Validation:**
- Content: Cannot be empty, sanitized for XSS
- Confidence: Must be 0-1
- Type: Must be valid enum value
- Tags: Sanitized, duplicates removed

---

### search_knowledge

Search knowledge base using semantic vector search.

**Input Schema:**

```json
{
  "query": "string",           // Required: Search query (max 500 chars)
  "type": "string",            // Optional: Filter by type
  "minConfidence": "number"    // Optional: Minimum confidence threshold (0-1)
}
```

**Example:**

```javascript
{
  "query": "how to handle API errors",
  "type": "solution",
  "minConfidence": 0.7
}
```

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "[
      {
        \"id\": \"550e8400-e29b-41d4-a716-446655440000\",
        \"type\": \"solution\",
        \"content\": \"Use retry with exponential backoff for API calls\",
        \"context\": \"Fixes intermittent network errors in production\",
        \"confidence\": 0.9,
        \"verified\": true,
        \"tags\": [\"api\", \"resilience\", \"networking\"],
        \"timestamp\": 1696723200000,
        \"accessCount\": 5,
        \"lastAccessed\": 1696809600000,
        \"relatedIds\": []
      }
    ]"
  }]
}
```

**Features:**
- Semantic search using embeddings
- Graceful degradation to text search if embeddings fail
- Results ranked by relevance
- Performance tracking included

---

### link_knowledge

Link related knowledge entries.

**Input Schema:**

```json
{
  "sourceId": "string",      // Required: Source entry ID
  "targetId": "string",      // Required: Target entry ID
  "relationship": "string"   // Optional: Relationship type (default: "relates_to")
}
```

**Example:**

```javascript
{
  "sourceId": "550e8400-e29b-41d4-a716-446655440000",
  "targetId": "660e8400-e29b-41d4-a716-446655440001",
  "relationship": "fixes"
}
```

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "Linked 550e8400... -> 660e8400..."
  }]
}
```

**Relationship Types:**
- `relates_to` (default)
- `fixes`
- `implements`
- `supersedes`
- `depends_on`
- Custom relationships allowed

---

### get_stats

Get comprehensive knowledge base statistics with performance metrics.

**Input Schema:**

```json
{}  // No parameters required
```

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "{
      \"totalEntries\": 42,
      \"byType\": {
        \"decision\": 10,
        \"error\": 8,
        \"solution\": 12,
        \"pattern\": 7,
        \"insight\": 5
      },
      \"byConfidence\": {
        \"high\": 15,
        \"medium\": 20,
        \"low\": 7
      },
      \"verified\": 25,
      \"mostAccessedId\": \"550e8400-e29b-41d4-a716-446655440000\",
      \"performance\": {
        \"embeddings\": {
          \"count\": 100,
          \"avgTime\": \"145.32\",
          \"minTime\": 89,
          \"maxTime\": 234
        },
        \"searches\": {
          \"count\": 50,
          \"avgTime\": \"234.56\",
          \"minTime\": 120,
          \"maxTime\": 450
        },
        \"database\": {
          \"size\": 42,
          \"lastUpdated\": 1696809600000
        }
      }
    }"
  }]
}
```

**Statistics Include:**
- Entry counts by type
- Confidence distribution
- Verification status
- Performance metrics (embeddings, searches, database)
- Most accessed entry

---

### export_markdown

Export entire knowledge base to structured Markdown.

**Input Schema:**

```json
{}  // No parameters required
```

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "Exported to: /path/to/.claude-memory/knowledge-export.md"
  }]
}
```

**Export Format:**

```markdown
# Project Knowledge Base

Generated: 2025-10-07T12:00:00.000Z

## Decisions

### Use TypeScript for new services
**Context:** Better type safety and developer experience
**Confidence:** 90%
**Verified:** Yes
**Tags:** architecture, typescript, best-practices
**Access count:** 12

---

## Solutions

### Retry with exponential backoff
...
```

**Features:**
- Organized by knowledge type
- Sorted by confidence within each type
- Includes all metadata
- Ready for documentation or review

---

### export_graph

Export knowledge graph in various visualization formats.

**Input Schema:**

```json
{
  "format": "string"  // Optional: "html" | "json" | "dot" | "d3" | "cytoscape" (default: "html")
}
```

**Example:**

```javascript
{
  "format": "html"
}
```

**Response (HTML format):**

```json
{
  "content": [{
    "type": "text",
    "text": "Graph visualization exported to: /path/to/.claude-memory/knowledge-graph.html\nOpen this file in your browser to view the interactive graph."
  }]
}
```

**Response (Other formats):**

```json
{
  "content": [{
    "type": "text",
    "text": "{\"nodes\": [...], \"edges\": [...]}"  // JSON/DOT/D3/Cytoscape format
  }]
}
```

**Supported Formats:**

| Format | Description | Use Case |
|--------|-------------|----------|
| `html` | Interactive D3.js visualization | Explore graph in browser |
| `json` | Raw graph data (nodes + edges) | Programmatic processing |
| `dot` | GraphViz DOT format | Generate diagrams with GraphViz |
| `d3` | D3.js-ready JSON structure | Custom D3 visualizations |
| `cytoscape` | Cytoscape.js format | Integrate with Cytoscape |

**Features:**
- Interactive graph navigation (HTML)
- Zoomable and pannable
- Shows relationships between knowledge
- Color-coded by type

---

### detect_contradictions

Detect semantic contradictions in the knowledge base using vector similarity.

**Input Schema:**

```json
{
  "similarityThreshold": "number",    // Optional: 0-1 (default: 0.85)
  "minConfidenceDelta": "number",     // Optional: 0-1 (default: 0.1)
  "sameTypeOnly": "boolean"           // Optional: Check within same type only (default: false)
}
```

**Example:**

```javascript
{
  "similarityThreshold": 0.85,
  "minConfidenceDelta": 0.1,
  "sameTypeOnly": false
}
```

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "{
      \"detected\": 2,
      \"contradictions\": [
        {
          \"entry1\": {
            \"id\": \"550e8400-e29b-41d4-a716-446655440000\",
            \"content\": \"Always use async/await\",
            \"confidence\": 0.9
          },
          \"entry2\": {
            \"id\": \"660e8400-e29b-41d4-a716-446655440001\",
            \"content\": \"Callbacks are better for simple operations\",
            \"confidence\": 0.7
          },
          \"similarity\": 0.87,
          \"confidenceDelta\": 0.2,
          \"reason\": \"High semantic similarity with conflicting advice\"
        }
      ]
    }"
  }]
}
```

**Detection Algorithm:**
1. Compare all entries using vector embeddings
2. Flag pairs with high similarity (> threshold)
3. Check if confidence scores differ significantly
4. Optionally filter to same type only

**Use Cases:**
- Find conflicting decisions
- Identify outdated knowledge
- Clean up knowledge base

---

### auto_resolve_contradictions

Automatically resolve detected contradictions by keeping higher-confidence entries.

**Input Schema:**

```json
{
  "similarityThreshold": "number"  // Optional: 0-1 (default: 0.85)
}
```

**Example:**

```javascript
{
  "similarityThreshold": 0.85
}
```

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "{
      \"resolved\": 2,
      \"kept\": [
        {
          \"id\": \"550e8400-e29b-41d4-a716-446655440000\",
          \"content\": \"Always use async/await\",
          \"confidence\": 0.9
        }
      ],
      \"superseded\": [
        {
          \"id\": \"660e8400-e29b-41d4-a716-446655440001\",
          \"content\": \"Callbacks are better for simple operations\",
          \"confidence\": 0.7,
          \"supersededBy\": \"550e8400-e29b-41d4-a716-446655440000\"
        }
      ]
    }"
  }]
}
```

**Resolution Strategy:**
- Keeps entry with **higher confidence**
- Marks lower-confidence entry as **superseded**
- Preserves superseded entries for history
- Creates link: `supersededBy` relationship

**Safety:**
- Non-destructive (keeps superseded entries)
- Reversible via history
- Confidence-based (objective criteria)

---

### get_superseded_history

Get history of all superseded knowledge entries.

**Input Schema:**

```json
{}  // No parameters required
```

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "{
      \"superseded\": 3,
      \"entries\": [
        {
          \"id\": \"660e8400-e29b-41d4-a716-446655440001\",
          \"type\": \"decision\",
          \"content\": \"Callbacks are better for simple operations\",
          \"confidence\": 0.7,
          \"supersededBy\": \"550e8400-e29b-41d4-a716-446655440000\",
          \"supersededAt\": 1696809600000
        }
      ]
    }"
  }]
}
```

**Use Cases:**
- Audit knowledge evolution
- Understand why decisions changed
- Restore accidentally superseded entries
- Track knowledge refinement over time

---

### analyze_patterns

Analyze frequency patterns and trends in the knowledge base.

**Input Schema:**

```json
{}  // No parameters required
```

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "{
      \"typeDistribution\": {
        \"decision\": 42,
        \"solution\": 38,
        \"error\": 15,
        \"pattern\": 10,
        \"insight\": 5
      },
      \"tagFrequency\": {
        \"api\": 25,
        \"authentication\": 18,
        \"database\": 15
      },
      \"confidenceTrend\": {
        \"avgConfidence\": 0.78,
        \"recentImprovement\": true,
        \"highConfidenceRatio\": 0.65
      },
      \"temporalPatterns\": {
        \"entriesLast7Days\": 12,
        \"entriesLast30Days\": 45,
        \"mostActiveDay\": \"2025-10-05\"
      },
      \"commonThemes\": [
        {
          \"theme\": \"API resilience\",
          \"frequency\": 15,
          \"avgConfidence\": 0.85
        }
      ]
    }"
  }]
}
```

**Metrics Provided:**
- Type distribution
- Tag frequency analysis
- Confidence trends
- Temporal patterns
- Common themes detection

**Use Cases:**
- Understand knowledge focus areas
- Identify knowledge gaps
- Track learning progress
- Guide future documentation

---

### generate_insights

Generate AI-powered insights and recommendations from knowledge patterns.

**Input Schema:**

```json
{
  "similarityThreshold": "number",  // Optional: 0-1 (default: 0.75)
  "minClusterSize": "number"        // Optional: Minimum cluster size (default: 2)
}
```

**Example:**

```javascript
{
  "similarityThreshold": 0.75,
  "minClusterSize": 2
}
```

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "{
      \"clusters\": 5,
      \"insights\": [
        {
          \"type\": \"knowledge_gap\",
          \"description\": \"Many errors about database connections but no documented solutions\",
          \"recommendation\": \"Create solution entries for common database error patterns\",
          \"priority\": \"high\"
        },
        {
          \"type\": \"consolidation_opportunity\",
          \"description\": \"15 similar decisions about API design scattered across entries\",
          \"recommendation\": \"Consolidate into a single comprehensive API design pattern\",
          \"priority\": \"medium\"
        },
        {
          \"type\": \"confidence_issue\",
          \"description\": \"Recent entries have lower confidence than older ones\",
          \"recommendation\": \"Review and verify recent additions\",
          \"priority\": \"medium\"
        }
      ],
      \"recommendations\": [
        \"Focus on documenting database solutions\",
        \"Create comprehensive patterns from scattered decisions\",
        \"Review verification process for recent entries\"
      ]
    }"
  }]
}
```

**Insight Types:**
- **knowledge_gap**: Missing documentation areas
- **consolidation_opportunity**: Duplicate/similar content
- **confidence_issue**: Low-confidence entries
- **emerging_pattern**: New trends detected
- **contradiction**: Conflicting information

---

### detect_antipatterns

Detect anti-patterns in the knowledge base (low confidence, unverified, rarely accessed).

**Input Schema:**

```json
{}  // No parameters required
```

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "{
      \"found\": 3,
      \"antiPatterns\": [
        {
          \"type\": \"low_confidence_unverified\",
          \"count\": 5,
          \"description\": \"Entries with confidence < 0.5 and unverified\",
          \"entries\": [
            {
              \"id\": \"770e8400-e29b-41d4-a716-446655440002\",
              \"content\": \"Maybe try caching?\",
              \"confidence\": 0.4,
              \"verified\": false
            }
          ],
          \"recommendation\": \"Verify or remove these low-confidence entries\"
        },
        {
          \"type\": \"never_accessed\",
          \"count\": 8,
          \"description\": \"Entries never accessed in 30+ days\",
          \"recommendation\": \"Review relevance of unused knowledge\"
        },
        {
          \"type\": \"orphaned_entries\",
          \"count\": 3,
          \"description\": \"Entries with no relationships to other knowledge\",
          \"recommendation\": \"Link to related knowledge or remove if irrelevant\"
        }
      ]
    }"
  }]
}
```

**Anti-Pattern Types:**
- `low_confidence_unverified`: Unreliable knowledge
- `never_accessed`: Unused entries
- `orphaned_entries`: Isolated knowledge
- `outdated`: Old, unupdated entries
- `contradictory`: Conflicting with higher-confidence knowledge

**Use Cases:**
- Knowledge base cleanup
- Quality assurance
- Identify entries to review or remove

---

### suggest_tags

Get intelligent tag suggestions based on content clustering.

**Input Schema:**

```json
{
  "similarityThreshold": "number"  // Optional: 0-1 (default: 0.75)
}
```

**Example:**

```javascript
{
  "similarityThreshold": 0.75
}
```

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "{
      \"suggestions\": 4,
      \"tags\": [
        {
          \"tag\": \"api-resilience\",
          \"confidence\": 0.85,
          \"relatedContent\": [
            \"Retry with exponential backoff\",
            \"Circuit breaker pattern\",
            \"Timeout configuration\"
          ],
          \"reasoning\": \"Common theme in 12 entries about API reliability\"
        },
        {
          \"tag\": \"database-optimization\",
          \"confidence\": 0.78,
          \"relatedContent\": [
            \"Use connection pooling\",
            \"Index frequently queried columns\"
          ],
          \"reasoning\": \"Cluster of 8 entries about database performance\"
        }
      ]
    }"
  }]
}
```

**Algorithm:**
1. Cluster similar content using embeddings
2. Extract common themes from clusters
3. Generate descriptive tag names
4. Rank by cluster size and coherence

**Use Cases:**
- Improve knowledge organization
- Discover implicit themes
- Standardize tagging across knowledge base

---

### cluster_knowledge

Cluster knowledge entries by semantic similarity.

**Input Schema:**

```json
{
  "similarityThreshold": "number",  // Optional: 0-1 (default: 0.75)
  "minClusterSize": "number",       // Optional: Minimum entries per cluster (default: 2)
  "maxClusters": "number"           // Optional: Maximum clusters to return (default: 10)
}
```

**Example:**

```javascript
{
  "similarityThreshold": 0.75,
  "minClusterSize": 2,
  "maxClusters": 10
}
```

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "{
      \"clustersFound\": 3,
      \"clusters\": [
        {
          \"size\": 8,
          \"avgConfidence\": 0.82,
          \"types\": [\"solution\", \"pattern\"],
          \"tags\": [\"api\", \"resilience\", \"retry\"],
          \"centroid\": {
            \"id\": \"550e8400-e29b-41d4-a716-446655440000\",
            \"content\": \"Use retry with exponential backoff for API calls...\"
          }
        }
      ]
    }"
  }]
}
```

**Clustering Algorithm:**
- Hierarchical clustering using vector embeddings
- Similarity threshold controls cluster tightness
- Returns cluster metadata (size, confidence, tags)
- Identifies most representative entry (centroid)

**Use Cases:**
- Discover knowledge patterns
- Organize related knowledge
- Find duplicates or near-duplicates
- Understand knowledge structure

---

### get_cache_stats

Get statistics about the embedding cache.

**Input Schema:**

```json
{}  // No parameters required
```

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "{
      \"size\": 156,
      \"hits\": 423,
      \"misses\": 89,
      \"hitRate\": 0.826,
      \"memoryUsage\": \"2.4 MB\",
      \"oldestEntry\": 1696723200000,
      \"newestEntry\": 1696809600000
    }"
  }]
}
```

**Cache Metrics:**
- **size**: Number of cached embeddings
- **hits**: Cache hits (embeddings reused)
- **misses**: Cache misses (embeddings generated)
- **hitRate**: Hit rate percentage (efficiency)
- **memoryUsage**: Approximate memory used
- **oldestEntry**: Timestamp of oldest cached entry
- **newestEntry**: Timestamp of newest cached entry

**Use Cases:**
- Monitor cache performance
- Optimize cache size
- Understand embedding reuse patterns

---

### clear_cache

Clear the embedding cache (useful for troubleshooting or memory management).

**Input Schema:**

```json
{}  // No parameters required
```

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "Cache cleared successfully"
  }]
}
```

**Effects:**
- Removes all cached embeddings from memory
- Next searches will regenerate embeddings
- Temporary performance decrease until cache rebuilds
- Does not affect stored knowledge (only cache)

**When to Use:**
- Cache corruption suspected
- Memory usage too high
- Testing performance without cache
- After model updates

---

### persist_cache

Persist the embedding cache to disk for faster startup.

**Input Schema:**

```json
{}  // No parameters required
```

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "Cache persisted to disk successfully"
  }]
}
```

**Behavior:**
- Saves cache to `.claude-memory/cache/embeddings.cache`
- Auto-loads on next startup
- Reduces cold-start time significantly
- Safe to call periodically

**Benefits:**
- Faster startup (no re-embedding needed)
- Preserves cache across restarts
- Improves performance consistency

**Recommended Usage:**
- After large batch imports
- Before system shutdown
- Periodically during heavy use

---

## JavaScript API

### KnowledgeStore

High-level API for knowledge management.

**Constructor:**

```javascript
import { KnowledgeStore } from './src/knowledge-store.js';

const store = new KnowledgeStore(projectPath);
await store.initialize();
```

**Methods:**

#### `addEntry(entry)`

```javascript
const id = await store.addEntry({
  type: 'solution',
  content: 'Use Redis for caching',
  context: 'Improves API response time',
  confidence: 0.85,
  verified: true,
  tags: ['performance', 'caching']
});
```

#### `search(query, filters)`

```javascript
const results = await store.search('caching solutions', {
  type: 'solution',
  minConfidence: 0.7
});
```

#### `updateEntry(id, updates)`

```javascript
await store.updateEntry(id, {
  confidence: 0.95,
  verified: true
});
```

#### `linkEntries(sourceId, targetId, relationship)`

```javascript
await store.linkEntries(errorId, solutionId, 'fixes');
```

#### `getStats()`

```javascript
const stats = await store.getStats();
console.log(stats.performance);
```

#### `exportMarkdown()`

```javascript
const path = await store.exportMarkdown();
console.log(`Exported to: ${path}`);
```

---

### VectorStore

Low-level vector database operations.

**Constructor:**

```javascript
import { VectorStore } from './src/vector-store.js';

const vectorStore = new VectorStore(memoryPath, {
  maxRetries: 3,
  initialRetryDelay: 1000,
  maxRetryDelay: 5000
});

await vectorStore.initialize();
```

**Methods:**

#### `generateEmbedding(text)`

```javascript
const embedding = await vectorStore.generateEmbedding('some text');
// Returns: Float32Array of 384 dimensions
```

#### `addVector(id, text, metadata)`

```javascript
await vectorStore.addVector(
  'unique-id',
  'searchable text content',
  { type: 'solution', confidence: 0.9, tags: ['tag1', 'tag2'] }
);
```

#### `search(query, topK, filters)`

```javascript
const results = await vectorStore.search(
  'search query',
  10,
  { type: 'solution', minConfidence: 0.7 }
);
```

#### `updateVector(id, text, metadata)`

```javascript
await vectorStore.updateVector(id, 'updated text', updatedMetadata);
```

#### `getPerformanceMetrics()`

```javascript
const metrics = vectorStore.getPerformanceMetrics();
console.log(metrics.embeddings.avgTime);
```

---

### Performance Monitoring

Track operation performance metrics.

**Import:**

```javascript
import { performanceMetrics, PerformanceTimer } from './src/utils/performance.js';
```

**Usage:**

```javascript
// Manual timing
const timer = new PerformanceTimer('my-operation');
await doSomething();
timer.record('custom-op', { metadata: 'value' });

// Get metrics
const metrics = performanceMetrics.getMetrics();
console.log(metrics.operations['custom-op']);

// Get summary
const summary = performanceMetrics.getSummary();
console.log(summary);

// Reset metrics
performanceMetrics.reset();
```

---

## Data Models

### KnowledgeEntry

```typescript
interface KnowledgeEntry {
  id: string;                    // UUID
  type: 'decision' | 'error' | 'solution' | 'pattern' | 'insight';
  content: string;               // Main content
  context?: string;              // Additional context
  confidence: number;            // 0-1
  verified: boolean;             // Verification status
  tags: string[];                // Searchable tags
  timestamp: number;             // Creation time (Unix ms)
  lastAccessed: number;          // Last access time
  accessCount: number;           // Access counter
  relatedIds: string[];          // Linked entry IDs
}
```

### PerformanceMetrics

```typescript
interface PerformanceMetrics {
  embeddings: {
    count: number;
    avgTime: string;    // ms
    minTime: number;
    maxTime: number;
  };
  searches: {
    count: number;
    avgTime: string;
    minTime: number;
    maxTime: number;
  };
  database: {
    size: number;
    lastUpdated: number | null;
  };
  operations: {
    [name: string]: {
      count: number;
      avgTime: string;
      minTime: number;
      maxTime: number;
    }
  };
}
```

---

## Error Handling

### Error Types

**Validation Errors:**
```javascript
{
  "content": [{
    "type": "text",
    "text": "Error: Confidence must be a number between 0 and 1"
  }],
  "isError": true
}
```

**Not Found Errors:**
```javascript
{
  "content": [{
    "type": "text",
    "text": "Error: Entry 550e8400... not found"
  }],
  "isError": true
}
```

**System Errors:**
```javascript
{
  "content": [{
    "type": "text",
    "text": "Error: VectorStore not initialized"
  }],
  "isError": true
}
```

### Retry & Circuit Breaker

Automatic retry with exponential backoff:

```javascript
// Retry configuration (in VectorStore)
{
  maxAttempts: 3,
  initialDelay: 1000,      // 1s
  maxDelay: 5000,          // 5s
  backoffFactor: 2
}

// Circuit breaker (automatic)
{
  failureThreshold: 5,
  resetTimeout: 30000      // 30s
}
```

**Graceful Degradation:**
- Semantic search → Text search fallback
- Embeddings failure → Continue with partial results
- Database errors → Retry with backoff

---

## Rate Limits & Quotas

**No hard limits**, but recommendations:

- **Embedding generation**: ~100 requests/minute (model constraint)
- **Search operations**: Unlimited (memory-bound)
- **Database size**: Tested up to 100,000 entries
- **Query length**: Max 500 characters (configurable)
- **Content length**: Max 10,000 characters (configurable)

---

## Best Practices

1. **Always await initialization:**
   ```javascript
   await store.initialize();
   ```

2. **Use appropriate confidence scores:**
   - 0.9-1.0: Verified, proven solutions
   - 0.7-0.9: High confidence, needs verification
   - 0.5-0.7: Medium confidence, experimental
   - 0-0.5: Low confidence, hypothetical

3. **Tag consistently:**
   ```javascript
   tags: ['language:typescript', 'area:backend', 'priority:high']
   ```

4. **Link related knowledge:**
   ```javascript
   await store.linkEntries(errorId, solutionId, 'fixes');
   ```

5. **Monitor performance:**
   ```javascript
   const stats = await store.getStats();
   console.log(stats.performance);
   ```

---

## See Also

- [Installation Guide](./INSTALLATION.md)
- [MCP Commands](./COMMANDS.md)
- [Best Practices](./BEST-PRACTICES.md)
- [Architecture](./ARCHITECTURE.md)
