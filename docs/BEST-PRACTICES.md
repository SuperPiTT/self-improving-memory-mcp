# Best Practices Guide

Guidelines and recommendations for using the Self-Improving Memory MCP Server effectively.

---

## Table of Contents

- [Knowledge Capture](#knowledge-capture)
- [Search Strategies](#search-strategies)
- [Confidence Scoring](#confidence-scoring)
- [Tagging System](#tagging-system)
- [Performance Optimization](#performance-optimization)
- [Data Organization](#data-organization)
- [Security](#security)
- [Maintenance](#maintenance)

---

## Knowledge Capture

### When to Save Knowledge

**✅ DO Save:**
- Solutions that worked in production
- Architectural decisions with rationale
- Errors and their root causes
- Reusable patterns and approaches
- Critical insights from debugging
- User requirements and preferences

**❌ DON'T Save:**
- Trivial or obvious information
- Temporary workarounds
- Unverified hypotheses (unless marked low confidence)
- Duplicate knowledge (search first!)
- Sensitive credentials or secrets

### Writing Effective Content

**Good Examples:**

```javascript
// ✅ Specific and actionable
{
  type: "solution",
  content: "Use connection pooling with max 50 connections for PostgreSQL",
  context: "Prevents connection exhaustion during peak traffic (500+ req/s)",
  confidence: 0.95,
  tags: ["database", "postgresql", "performance", "production"]
}

// ✅ Clear decision with reasoning
{
  type: "decision",
  content: "Migrate authentication to OAuth 2.0 with JWT tokens",
  context: "Enables SSO integration, reduces session storage overhead, industry standard",
  confidence: 0.9,
  tags: ["auth", "oauth", "jwt", "architecture"]
}
```

**Bad Examples:**

```javascript
// ❌ Too vague
{
  content: "Fix the bug",
  tags: ["bug"]
}

// ❌ No context
{
  content: "Use Redis",
  confidence: 0.8
}

// ❌ Too specific, not reusable
{
  content: "Changed line 42 in file UserController.js",
  context: "Fixed typo in variable name"
}
```

### Content Guidelines

1. **Be Specific**
   - Include concrete details
   - Mention technologies/versions
   - State measurable outcomes

2. **Provide Context**
   - Why was this decision made?
   - What problem does it solve?
   - What were the alternatives?

3. **Include Metadata**
   - When was it implemented?
   - What environment? (dev/staging/prod)
   - Who validated it?

4. **Link Related Knowledge**
   - Connect errors to solutions
   - Link decisions to implementations
   - Show evolution of patterns

---

## Search Strategies

### Semantic Search Tips

The system uses **semantic embeddings**, so it understands meaning, not just keywords.

**✅ Effective Queries:**

```
# Good - describes the problem
"How to prevent database connection timeouts during high traffic"

# Good - asks for pattern
"Best practices for error handling in async operations"

# Good - describes outcome
"Solutions that improved API response time"
```

**❌ Less Effective:**

```
# Too short - lacks context
"database"

# Too broad - will return many results
"errors"

# Too specific - might miss related solutions
"line 42 timeout fix"
```

### Filtering Strategies

**By Type:**
```javascript
// Find only proven solutions
search("caching strategies", {
  type: "solution",
  minConfidence: 0.8
})

// Review past decisions
search("architecture", {
  type: "decision"
})

// Learn from errors
search("production issues", {
  type: "error"
})
```

**By Confidence:**
```javascript
// High confidence - production ready
minConfidence: 0.8

// Medium - needs review
minConfidence: 0.5

// All including hypotheses
minConfidence: 0
```

### Search Workflow

1. **Start Broad**
   ```
   search("performance issues")
   ```

2. **Refine with Filters**
   ```
   search("performance issues", {
     type: "solution",
     minConfidence: 0.7
   })
   ```

3. **Review Results**
   - Check confidence scores
   - Read context for applicability
   - Follow links to related knowledge

4. **Capture Gaps**
   - If no results found, document new knowledge
   - If results outdated, add updated solution

---

## Confidence Scoring

### Confidence Scale

| Score | Meaning | When to Use |
|-------|---------|-------------|
| **0.95-1.0** | Verified in production | Proven solutions, confirmed decisions |
| **0.85-0.95** | High confidence | Well-tested, multiple successful uses |
| **0.7-0.85** | Solid approach | Tested in dev/staging, needs prod validation |
| **0.5-0.7** | Medium confidence | Experimental, promising but unproven |
| **0.3-0.5** | Low confidence | Hypothesis, needs testing |
| **0-0.3** | Speculation | Brainstorming, research needed |

### Scoring Guidelines

**✅ High Confidence (0.8+)**
```javascript
{
  content: "Use Redis for session caching",
  context: "Reduced API latency from 500ms to 50ms in production",
  confidence: 0.95,  // ✅ Proven in production
  verified: true
}
```

**⚠️ Medium Confidence (0.5-0.8)**
```javascript
{
  content: "GraphQL subscriptions for real-time updates",
  context: "Works well in dev, pending load testing",
  confidence: 0.7,  // ⚠️ Needs validation
  verified: false
}
```

**❓ Low Confidence (<0.5)**
```javascript
{
  content: "Consider WebAssembly for CPU-intensive tasks",
  context: "Might improve performance, needs prototyping",
  confidence: 0.4,  // ❓ Hypothesis
  verified: false
}
```

### Updating Confidence

As knowledge is validated:

```javascript
// Initially
confidence: 0.6, verified: false

// After successful staging test
confidence: 0.75, verified: false

// After production validation
confidence: 0.95, verified: true
```

---

## Tagging System

### Tag Categories

**1. Technical Tags**
```javascript
tags: [
  "lang:typescript",
  "framework:react",
  "db:postgresql",
  "cloud:aws"
]
```

**2. Domain Tags**
```javascript
tags: [
  "domain:auth",
  "domain:payment",
  "domain:analytics"
]
```

**3. Priority/Status Tags**
```javascript
tags: [
  "priority:critical",
  "status:verified",
  "status:deprecated",
  "status:experimental"
]
```

**4. Environment Tags**
```javascript
tags: [
  "env:production",
  "env:staging",
  "env:development"
]
```

**5. Category Tags**
```javascript
tags: [
  "category:performance",
  "category:security",
  "category:scalability"
]
```

### Tagging Best Practices

**✅ DO:**
- Use consistent naming: `area:value`
- Include technology: `lang:python`
- Add priority when relevant: `priority:high`
- Tag by environment: `env:production`
- Use lowercase for consistency

**❌ DON'T:**
- Use spaces in tags: `"my tag"` → `"my-tag"`
- Duplicate information: `["redis", "cache"]` if one implies the other
- Over-tag: 3-7 tags is ideal
- Use vague tags: `"stuff"`, `"things"`

### Tag Examples

**Good Tagging:**
```javascript
// ✅ Clear, hierarchical, consistent
tags: [
  "lang:typescript",
  "area:backend",
  "domain:auth",
  "priority:critical",
  "env:production"
]
```

**Poor Tagging:**
```javascript
// ❌ Vague, inconsistent, too many
tags: [
  "code",
  "BackEnd",
  "IMPORTANT!!!",
  "typescript stuff",
  "production issue",
  "needs fixing",
  "urgent",
  "todo"
]
```

---

## Performance Optimization

### Startup Performance

**First Run (Slow):**
- Downloads embedding model (~90MB)
- Takes 30-60 seconds
- One-time only

**Subsequent Runs (Fast):**
- Model cached locally
- Starts in 2-3 seconds

**Warm-up:**
```javascript
// Happens automatically on initialize()
await store.initialize();  // Includes warm-up
```

### Search Performance

**Optimize Queries:**
```javascript
// ✅ Specific query = faster
search("Redis caching pattern")

// ❌ Broad query = slower
search("cache")
```

**Use Filters:**
```javascript
// ✅ Filter early
search("API", { type: "solution", minConfidence: 0.8 })

// ❌ Filter manually after
const all = search("API")
const filtered = all.filter(...)
```

### Database Performance

**Monitor Size:**
```javascript
const stats = await store.getStats();
console.log(stats.performance.database.size);

// Recommend: < 100,000 entries for best performance
```

**Cleanup Old Entries:**
```javascript
// Export first
await store.exportMarkdown();

// Delete low-confidence, old entries
// (Manual cleanup or custom script)
```

### Memory Usage

**Expected:**
- Embedding model: ~200-300MB RAM
- Vector database: ~1MB per 1000 entries
- Total: ~500MB for typical usage

**Monitor:**
```javascript
// Check performance metrics
const stats = await store.getStats();
console.log(stats.performance);
```

---

## Data Organization

### File Structure

```
project-root/
├── .claude-memory/
│   ├── vectors/
│   │   └── lancedb/           # Vector database
│   ├── logs/
│   │   ├── error.log          # Error logs (5MB max, 5 files)
│   │   └── combined.log       # All logs
│   └── knowledge-export.md    # Markdown exports
```

### Backup Strategy

**1. Regular Exports**
```bash
# Weekly export
memory-cli export --output=backups/$(date +%Y-%m-%d).md

# Automated with cron
0 0 * * 0 memory-cli export --output=/backups/weekly.md
```

**2. Database Backup**
```bash
# Backup vector database
cp -r .claude-memory/vectors backups/vectors-$(date +%Y-%m-%d)
```

**3. Version Control**
```bash
# Track exports in git
git add .claude-memory/knowledge-export.md
git commit -m "Knowledge backup $(date +%Y-%m-%d)"
```

### Data Retention

**Lifecycle Management:**

1. **Active (0-3 months)**
   - High confidence: Keep
   - Low confidence: Review and verify or delete

2. **Aging (3-12 months)**
   - Verified: Keep
   - Unverified: Archive or delete
   - Deprecated: Mark with tag `status:deprecated`

3. **Archive (12+ months)**
   - Export to markdown
   - Remove from active database
   - Store in documentation

---

## Security

### Input Validation

**Automatic Sanitization:**
```javascript
// HTML tags removed
"<script>alert('xss')</script>" → "scriptalert('xss')/script"

// Control characters removed
"Hello\x00World" → "HelloWorld"

// Max length enforced
content.length <= 10000  // characters
query.length <= 500      // characters
```

### Sensitive Data

**❌ NEVER Store:**
- Passwords or API keys
- Access tokens
- Private keys or certificates
- Personal identification data
- Credit card numbers

**✅ Instead:**
```javascript
{
  content: "Store API keys in environment variables using dotenv",
  context: "Prevents credentials in source code, enables per-environment config",
  tags: ["security", "api", "best-practice"]
}
```

### Access Control

**File Permissions:**
```bash
# Restrict .claude-memory access
chmod 700 .claude-memory
chmod 600 .claude-memory/vectors/*
```

**Network Security:**
- MCP server runs locally (stdio transport)
- No external network access required (after model download)
- Embedding model cached locally

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor performance metrics via `get_stats`
- Check for slow operations in logs

**Weekly:**
- Export knowledge base: `export_markdown`
- Review unverified entries (confidence < 0.8)
- Update confidence scores based on usage

**Monthly:**
- Backup vector database
- Clean up deprecated knowledge
- Review and merge duplicate entries

### Health Checks

**1. Performance Check**
```javascript
const stats = await store.getStats();

// Check embedding performance
if (stats.performance.embeddings.avgTime > 200) {
  console.warn("Slow embedding generation");
}

// Check search performance
if (stats.performance.searches.avgTime > 500) {
  console.warn("Slow searches");
}
```

**2. Database Health**
```javascript
// Run periodically
const count = await vectorStore.count();
console.log(`Database size: ${count} entries`);

// Warn if too large
if (count > 100000) {
  console.warn("Consider archiving old entries");
}
```

**3. Coverage Check**
```javascript
const stats = await store.getStats();

// Check distribution
console.log("Knowledge by type:", stats.byType);
console.log("Confidence distribution:", stats.byConfidence);

// Flag gaps
if (stats.byType.solution < stats.byType.error) {
  console.warn("More errors than solutions - document fixes");
}
```

### Troubleshooting

**Slow Performance:**
1. Check database size: `get_stats`
2. Review performance metrics
3. Archive old entries
4. Restart server to clear cache

**High Memory Usage:**
1. Monitor with `top` or Task Manager
2. Expected: ~500MB
3. If >1GB: restart server
4. Check for memory leaks in logs

**Search Quality Issues:**
1. Verify query is semantic: "how to X" not "X"
2. Check confidence filters aren't too strict
3. Ensure embeddings are working (check logs)
4. Try text fallback is working

---

## Common Pitfalls

### ❌ Antipatterns

**1. Duplicate Knowledge**
```javascript
// ❌ Don't save without searching first
await store.addEntry({ content: "Use caching" });

// ✅ Search first, then add if missing
const existing = await store.search("caching");
if (existing.length === 0) {
  await store.addEntry({ content: "Use Redis caching" });
}
```

**2. Vague Content**
```javascript
// ❌ Too generic
{ content: "Fix bug", tags: ["bug"] }

// ✅ Specific and actionable
{
  content: "Add null check in getUserProfile() to prevent NPE",
  context: "Fixes crash when user has no profile image",
  tags: ["bug", "null-check", "user-profile"]
}
```

**3. Ignoring Confidence**
```javascript
// ❌ All entries at 0.5
confidence: 0.5

// ✅ Reflect actual confidence
confidence: 0.95,  // Proven in production
verified: true
```

**4. Poor Tagging**
```javascript
// ❌ Random tags
tags: ["stuff", "code", "important"]

// ✅ Structured tags
tags: ["lang:python", "area:backend", "priority:high"]
```

### ✅ Best Patterns

**1. Link Related Knowledge**
```javascript
// Save error
const errorId = await store.addEntry({
  type: "error",
  content: "Timeout connecting to database"
});

// Save solution
const solutionId = await store.addEntry({
  type: "solution",
  content: "Increase connection timeout to 30s"
});

// Link them
await store.linkEntries(errorId, solutionId, "fixes");
```

**2. Evolve Knowledge**
```javascript
// Old solution (mark as deprecated)
await store.updateEntry(oldId, {
  tags: [...oldTags, "status:deprecated"],
  context: "Superseded by new approach"
});

// New solution
const newId = await store.addEntry({
  content: "Improved connection pooling strategy",
  confidence: 0.9
});

// Link evolution
await store.linkEntries(newId, oldId, "supersedes");
```

**3. Regular Reviews**
```javascript
// Find unverified high-confidence entries
const results = await store.search("", { minConfidence: 0.8 });
const unverified = results.filter(r => !r.verified);

// Review and verify or adjust confidence
for (const entry of unverified) {
  // Manual review, then update
  await store.updateEntry(entry.id, { verified: true });
}
```

---

## Summary Checklist

**Before Saving Knowledge:**
- [ ] Searched for duplicates
- [ ] Content is specific and actionable
- [ ] Context explains why/when/how
- [ ] Confidence score reflects reality
- [ ] Tags are structured and consistent
- [ ] No sensitive data included

**After Saving:**
- [ ] Link to related entries
- [ ] Verify in practice
- [ ] Update confidence when proven
- [ ] Tag appropriately

**Maintenance:**
- [ ] Weekly exports
- [ ] Monthly cleanup
- [ ] Regular performance checks
- [ ] Review unverified entries

---

## See Also

- [Commands Reference](./COMMANDS.md)
- [API Documentation](./API.md)
- [Architecture](./ARCHITECTURE.md)
- [Installation](./INSTALLATION.md)
