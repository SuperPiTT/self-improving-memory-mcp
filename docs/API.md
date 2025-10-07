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
