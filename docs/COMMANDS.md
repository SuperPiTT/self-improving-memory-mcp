# MCP Commands Reference

Quick reference guide for all MCP server commands and CLI tools.

---

## Table of Contents

- [MCP Server Commands](#mcp-server-commands)
- [Memory CLI Commands](#memory-cli-commands)
- [Common Workflows](#common-workflows)
- [Command Examples](#command-examples)

---

## MCP Server Commands

Use these commands through Claude Desktop or any MCP client.

### save_knowledge

Save knowledge with semantic embeddings.

**Basic Usage:**
```
Save this solution: "Use Redis for session storage"
- Type: solution
- Confidence: 0.9
- Tags: caching, performance, redis
```

**With Context:**
```
Save this decision:
Content: "Migrate from REST to GraphQL"
Context: "Reduces over-fetching and improves mobile performance"
Confidence: 0.85
Tags: api, graphql, architecture
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | enum | ✅ | decision, error, solution, pattern, insight |
| content | string | ✅ | The knowledge content |
| context | string | ❌ | Additional context or reasoning |
| confidence | number | ✅ | Confidence score (0-1) |
| verified | boolean | ❌ | Verification status (default: false) |
| tags | array | ✅ | Searchable tags |

---

### search_knowledge

Search knowledge base using semantic vector search.

**Basic Usage:**
```
Search for: "how to handle database errors"
```

**With Filters:**
```
Search for: "API optimization"
Type: solution
Minimum confidence: 0.7
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | ✅ | Search query (max 500 chars) |
| type | enum | ❌ | Filter by type |
| minConfidence | number | ❌ | Minimum confidence (0-1) |

**Response:** Returns top 10 most relevant results ranked by semantic similarity.

---

### link_knowledge

Create relationships between knowledge entries.

**Basic Usage:**
```
Link entries:
Source: [error-id]
Target: [solution-id]
Relationship: "fixes"
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sourceId | string | ✅ | Source entry UUID |
| targetId | string | ✅ | Target entry UUID |
| relationship | string | ❌ | Type of relationship (default: "relates_to") |

**Common Relationships:**
- `fixes` - Solution fixes an error
- `implements` - Implementation of a pattern/decision
- `supersedes` - Replaces older knowledge
- `depends_on` - Requires another entry
- `relates_to` - General relationship

---

### get_stats

Get comprehensive knowledge base statistics.

**Usage:**
```
Get knowledge base statistics
```

**No parameters required.**

**Returns:**
- Total entries count
- Breakdown by type (decision, error, solution, pattern, insight)
- Confidence distribution (high, medium, low)
- Verification count
- Most accessed entry
- **Performance metrics:**
  - Embedding generation stats
  - Search latency stats
  - Database size

---

### export_markdown

Export entire knowledge base to Markdown.

**Usage:**
```
Export knowledge base to markdown
```

**No parameters required.**

**Output:** Creates `.claude-memory/knowledge-export.md` with:
- All entries organized by type
- Sorted by confidence
- Full metadata included
- Ready for documentation or review

---

## Memory CLI Commands

Use the CLI tool for direct command-line access.

### Installation

```bash
# Global install
npm install -g self-improving-memory-mcp

# Or use locally
node memory-cli.js [command]
```

### search

Search knowledge from command line.

```bash
# Basic search
memory-cli search "API optimization"

# With filters
memory-cli search "caching" --type=solution --min-confidence=0.8

# JSON output
memory-cli search "error handling" --json
```

**Options:**
- `--type=<type>` - Filter by knowledge type
- `--min-confidence=<num>` - Minimum confidence threshold
- `--json` - Output in JSON format
- `--limit=<num>` - Max results (default: 10)

### stats

Display knowledge base statistics.

```bash
# Human-readable stats
memory-cli stats

# JSON format
memory-cli stats --json

# Performance only
memory-cli stats --performance
```

**Options:**
- `--json` - JSON output
- `--performance` - Show only performance metrics
- `--verbose` - Detailed statistics

### export

Export knowledge base.

```bash
# Export to markdown
memory-cli export

# Custom output path
memory-cli export --output=/path/to/export.md

# Include performance stats
memory-cli export --include-stats
```

**Options:**
- `--output=<path>` - Custom export path
- `--include-stats` - Add stats to export
- `--format=<fmt>` - Export format (markdown, json)

### add

Add knowledge from command line.

```bash
# Interactive mode
memory-cli add

# Direct input
memory-cli add \
  --type=solution \
  --content="Use connection pooling" \
  --confidence=0.9 \
  --tags="database,performance"

# From file
memory-cli add --from-file=knowledge.json
```

**Options:**
- `--type=<type>` - Knowledge type
- `--content=<text>` - Content
- `--context=<text>` - Optional context
- `--confidence=<num>` - Confidence score
- `--tags=<tags>` - Comma-separated tags
- `--verified` - Mark as verified
- `--from-file=<path>` - Import from JSON

### link

Link knowledge entries.

```bash
# Link two entries
memory-cli link \
  --source=<source-id> \
  --target=<target-id> \
  --relationship=fixes
```

**Options:**
- `--source=<id>` - Source entry ID
- `--target=<id>` - Target entry ID
- `--relationship=<type>` - Relationship type

---

## Common Workflows

### 1. Capture Error & Solution

```bash
# Step 1: Save the error
Save this error:
Content: "Database connection timeout in production"
Context: "Occurs during peak traffic hours"
Confidence: 1.0
Tags: database, error, production

# Step 2: Save the solution
Save this solution:
Content: "Increase connection pool size to 50"
Context: "Fixed timeout issues during peak hours"
Confidence: 0.9
Tags: database, solution, performance

# Step 3: Link them
Link entries:
Source: [error-id]
Target: [solution-id]
Relationship: "fixes"
```

### 2. Document Architecture Decision

```bash
# Save the decision
Save this decision:
Content: "Use microservices architecture for new features"
Context: "Enables independent scaling and deployment"
Confidence: 0.85
Tags: architecture, microservices, scalability

# Link to implementation pattern
Link entries:
Source: [decision-id]
Target: [pattern-id]
Relationship: "implements"
```

### 3. Search & Review Knowledge

```bash
# Search for solutions
Search for: "performance optimization"
Type: solution
Min confidence: 0.8

# Review stats
Get knowledge base statistics

# Export for review
Export knowledge base to markdown
```

### 4. Batch Import Knowledge

```bash
# Create JSON file (knowledge.json)
{
  "entries": [
    {
      "type": "solution",
      "content": "Use CDN for static assets",
      "confidence": 0.9,
      "tags": ["performance", "cdn"]
    }
  ]
}

# Import
memory-cli add --from-file=knowledge.json
```

---

## Command Examples

### Example 1: Debugging Workflow

```bash
# 1. Capture error
Save error: "React component re-rendering infinitely"
Tags: react, bug, performance

# 2. Document investigation
Save insight: "useEffect missing dependency array"
Tags: react, debugging

# 3. Save solution
Save solution: "Add empty dependency array to useEffect"
Confidence: 0.95
Tags: react, solution, hooks

# 4. Link them
Link: [error] -> [insight] (relates_to)
Link: [insight] -> [solution] (leads_to)
```

### Example 2: Performance Optimization

```bash
# Search existing knowledge
Search: "slow API responses"
Type: solution

# Save new optimization
Save solution:
Content: "Implement Redis caching for user sessions"
Context: "Reduced API latency from 500ms to 50ms"
Confidence: 0.95
Tags: performance, caching, redis, api

# Check stats
Get statistics
```

### Example 3: Knowledge Review

```bash
# Weekly review workflow
memory-cli stats --performance
memory-cli export --include-stats
memory-cli search "unverified" --min-confidence=0.5

# Verify and update
# (manually verify entries, then update via MCP)
```

### Example 4: Team Knowledge Sharing

```bash
# Export for team
memory-cli export --output=team-knowledge.md

# Add team member's knowledge
memory-cli add --from-file=teammate-knowledge.json

# Search for duplicates
memory-cli search "docker deployment" --json | jq
```

---

## Tips & Tricks

### 1. Effective Searching

```bash
# Use semantic search - it understands context
Search: "handle errors gracefully"  # Finds retry logic, fallbacks, etc.

# Combine filters
Search: "database" --type=solution --min-confidence=0.8

# Search by tag pattern (via CLI)
memory-cli search "tag:production tag:error"
```

### 2. Confidence Scoring

- **1.0** - Verified, proven in production
- **0.9** - High confidence, tested
- **0.8** - Solid solution, needs minor verification
- **0.7** - Good approach, experimental
- **0.5** - Hypothesis, untested
- **<0.5** - Low confidence, brainstorming

### 3. Tagging Strategy

```bash
# Use hierarchical tags
tags: ["lang:typescript", "area:backend", "priority:high"]

# Use status tags
tags: ["status:verified", "status:deprecated", "status:experimental"]

# Use domain tags
tags: ["domain:auth", "domain:payment", "domain:analytics"]
```

### 4. Performance Optimization

```bash
# Check performance regularly
Get statistics  # Look at performance section

# Warm up on startup (automatic)
# First search may be slow (~1s), subsequent faster

# Monitor slow operations
# Embeddings >1s and searches >2s are logged
```

---

## Keyboard Shortcuts (Claude Desktop)

When using MCP tools in Claude Desktop:

- `Cmd/Ctrl + K` - Quick command palette
- Type tool name to autocomplete
- Use arrow keys to navigate suggestions
- `Enter` to select and fill parameters

---

## Error Messages

### Common Errors & Solutions

**"Content cannot be empty"**
```bash
# Ensure content is provided
Content: "Your knowledge here"
```

**"Confidence must be between 0 and 1"**
```bash
# Use decimal format
Confidence: 0.85  # Not 85
```

**"Entry not found"**
```bash
# Verify ID exists
Get statistics  # Check mostAccessedId
Search for entry first
```

**"Search query too long"**
```bash
# Limit to 500 characters
Search: "shorter query"
```

---

## See Also

- [API Reference](./API.md) - Detailed API documentation
- [Installation](./INSTALLATION.md) - Setup instructions
- [Best Practices](./BEST-PRACTICES.md) - Usage recommendations
- [Architecture](./ARCHITECTURE.md) - System design
