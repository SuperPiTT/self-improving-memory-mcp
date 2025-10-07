# Changelog

All notable changes to the Self-Improving Memory MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.1] - 2025-10-07

### Added
- Complete API documentation for all 17 MCP tools
- Slash commands documentation (`/checkpoint`, `/memory-help`, `/mh`)
- Performance benchmarks in documentation
- CHANGELOG.md with migration guide

### Fixed
- Corrected Claude Desktop config paths in INSTALLATION.md
- Updated README.md tool count (8 → 17)
- Fixed QUICK-INSTALL.md tool count (18 → 17)
- Removed references to non-existent documentation files

### Documentation
- 100% API coverage (all 17 tools documented)
- Added migration guide from v1.x to v2.x
- Reorganized COMMANDS.md with MCP/CLI/Slash sections
- Updated DOCUMENTATION-AUDIT-REPORT.md

---

## [2.0.0] - 2025-10-05

### 🎉 Major Release - Complete System Overhaul

### Added - Core Features
- **17 MCP Tools** (12 new advanced tools):
  - `export_graph` - Multi-format graph visualization (HTML, JSON, DOT, D3, Cytoscape)
  - `detect_contradictions` - Semantic contradiction detection
  - `auto_resolve_contradictions` - Automatic resolution by confidence
  - `get_superseded_history` - Knowledge evolution tracking
  - `analyze_patterns` - Frequency and trend analysis
  - `generate_insights` - AI-powered recommendations
  - `detect_antipatterns` - Quality assurance detection
  - `suggest_tags` - Intelligent tag suggestions
  - `cluster_knowledge` - Semantic clustering
  - `get_cache_stats` - Embedding cache metrics
  - `clear_cache` - Cache management
  - `persist_cache` - Persistent cache for faster startup

### Added - Anti-Compaction System
- **Zero Context Loss**: Prevents Claude's autocompact from losing information
- **Automatic Checkpointing**: Triggers at 80% context usage (160k tokens)
- **Seamless Recovery**: Context Recovery Agent auto-loads state in new conversations
- **Manual Checkpoints**: `/checkpoint` slash command for user-triggered saves
- Pre-Compact Interceptor Agent
- Context Recovery Agent
- Session Context Agent

### Added - Autonomous Agents (10 total)
- Pattern Recognition Agent - Search knowledge before tasks
- Error Detection Agent - Capture errors automatically
- Solution Capture Agent - Save successful fixes
- Decision Tracker Agent - Remember architectural choices
- User Intent Capture Agent - Track user preferences
- Style Preferences Agent - Learn coding style
- Confidence Evaluator Agent - Maintain knowledge quality
- Pre-Compact Interceptor Agent - Prevent context loss
- Context Recovery Agent - Resume from checkpoints
- Session Context Agent - Preserve work across sessions

### Added - Advanced Features
- **Semantic Search**: Vector embeddings with all-MiniLM-L6-v2 (384D)
- **LanceDB Integration**: High-performance vector database
- **Embedding Cache**: Faster searches with intelligent caching
- **Circuit Breaker Pattern**: Resilient error handling
- **Performance Monitoring**: Real-time metrics tracking
- **Graceful Degradation**: Text search fallback

### Added - Installation Options
- **Clean Mode** (default): No files copied to `.claude/`
- **Custom Mode** (`--custom`): Copies agents/commands to `.claude-mcp/`
- NPM package: `@pytt0n/self-improving-memory-mcp`
- Automatic installer: `npx @pytt0n/self-improving-memory-mcp`

### Changed - Breaking Changes
- **Configuration Path**: Now uses `.claude-memory/` (was `.memory/`)
- **MCP Tool Names**: Standardized naming (e.g., `save_knowledge` instead of `saveKnowledge`)
- **Node.js Requirement**: Now requires Node.js >= 18.0.0
- **Package Name**: Changed to `@pytt0n/self-improving-memory-mcp`

### Improved
- **Test Coverage**: 263 tests, 85%+ code coverage
- **Performance**:
  - Embedding generation: ~145ms average
  - Search latency: ~235ms average
  - Startup time: <5s (with cache)
- **Security**: XSS sanitization, input validation
- **Reliability**: Retry with exponential backoff

### Documentation
- Complete API reference (docs/API.md)
- Installation guide (docs/INSTALLATION.md)
- MCP commands reference (docs/COMMANDS.md)
- Best practices guide (docs/BEST-PRACTICES.md)
- Architecture documentation (docs/ARCHITECTURE.md)
- Agent documentation (.claude/agents/)

---

## [1.x] - Legacy Version

The 1.x version was a basic memory system without:
- Vector search (text-only)
- Autonomous agents
- Anti-compaction system
- Advanced analytics
- Graph visualization
- Contradiction detection

See [Migration Guide](#migration-guide-v1x-to-v20) below for upgrade instructions.

---

## Migration Guide: v1.x to v2.0

### Prerequisites

- Node.js >= 18.0.0 (check with `node --version`)
- Clean v1.x installation (backup your data first)

### Step 1: Backup Your Data

```bash
# Export v1.x knowledge base
cd /path/to/v1.x
node memory-cli.js export --output=v1-backup.json

# Backup memory directory
cp -r .memory .memory-backup
```

### Step 2: Install v2.0

```bash
# Option A: Fresh install via NPM
npx @pytt0n/self-improving-memory-mcp

# Option B: Clone and install
git clone https://github.com/SuperPiTT/self-improving-memory-mcp.git
cd self-improving-memory-mcp
npm install
npm test
```

### Step 3: Update Configuration

**Old config (v1.x):**
```json
{
  "mcpServers": {
    "memory": {
      "command": "node",
      "args": ["/path/to/v1/index.js"]
    }
  }
}
```

**New config (v2.0):**
```json
{
  "mcpServers": {
    "memory": {
      "command": "node",
      "args": ["/path/to/self-improving-memory-mcp/index.js"],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**Config file locations:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`

### Step 4: Migrate Data

v2.0 uses LanceDB and vector embeddings. Data migration is automatic on first run:

```bash
# Start v2.0 server
npm start

# System will automatically:
# 1. Detect old .memory/ directory
# 2. Generate embeddings for existing entries
# 3. Create new .claude-memory/ database
# 4. Preserve all relationships and metadata
```

**Note**: First startup may take 2-5 minutes depending on data size (embedding generation).

### Step 5: Verify Migration

```bash
# Check stats
node memory-cli.js stats

# Should show all your entries with new fields:
# - Embedding vectors (384D)
# - Enhanced metadata
# - Performance metrics
```

### Breaking Changes and Adaptations

#### 1. Tool Names Changed

| v1.x | v2.0 |
|------|------|
| `saveKnowledge` | `save_knowledge` |
| `searchKnowledge` | `search_knowledge` |
| `linkKnowledge` | `link_knowledge` |
| `getStats` | `get_stats` |
| `exportMarkdown` | `export_markdown` |

**Migration**: Update any scripts or workflows using old names.

#### 2. Memory Path Changed

- v1.x: `.memory/`
- v2.0: `.claude-memory/`

**Migration**: System auto-migrates. Old `.memory/` can be deleted after verification.

#### 3. Search Behavior Changed

- v1.x: Text-based substring search
- v2.0: Semantic vector search (understands meaning)

**Impact**: Searches now find conceptually similar content, not just keyword matches.

**Example:**
```
Query: "handle errors gracefully"

v1.x: Only finds entries with exact words "handle", "errors", "gracefully"
v2.0: Finds retry logic, fallbacks, circuit breakers (semantic understanding)
```

#### 4. Confidence Scoring More Important

v2.0 uses confidence for:
- Contradiction resolution (keeps higher confidence)
- Search ranking (boosts high-confidence results)
- Anti-pattern detection (flags low confidence)

**Recommendation**: Review and update confidence scores for existing entries.

### New Features to Adopt

#### 1. Use Anti-Compaction System

Add to your Claude Code `.claude/CLAUDE.md`:

```markdown
⚠️ CHECK CONTEXT USAGE FIRST - MANDATORY ⚠️

Check `<budget:token_budget>` in system messages:
- If >= 160k tokens (80%): STOP and launch Pre-Compact Interceptor Agent
- If >= 40 messages: STOP and launch Pre-Compact Interceptor Agent
```

#### 2. Enable Autonomous Agents

Copy agents to your project:

```bash
# Run installer in custom mode
npx @pytt0n/self-improving-memory-mcp --custom

# Agents copied to .claude-mcp/agents/
# Commands copied to .claude-mcp/commands/
```

#### 3. Use New Advanced Tools

Try the new analytics:

```
# Detect contradictions
detect_contradictions

# Generate insights
generate_insights

# View knowledge graph
export_graph --format=html
(Open knowledge-graph.html in browser)

# Analyze patterns
analyze_patterns
```

### Rollback Plan

If you need to rollback to v1.x:

```bash
# 1. Stop v2.0 server
# 2. Restore v1.x config
# 3. Restore backup
cp -r .memory-backup .memory

# 4. Your v1-backup.json contains all data
```

### Performance Expectations

After migration, expect:

- **First startup**: 30-60s (embedding model download)
- **Subsequent startups**: <5s
- **First search**: ~1s (cache warming)
- **Subsequent searches**: ~200-300ms
- **Memory usage**: ~200-300MB (embedding model)

### Troubleshooting Migration

#### Issue: "Model failed to load"

```bash
# Ensure internet connection for first download
# Clear cache if corruption suspected
rm -rf ~/.cache/transformers.js
npm start
```

#### Issue: "Old data not found"

```bash
# Check memory path
ls -la .memory/        # v1.x data
ls -la .claude-memory/ # v2.0 data

# Manual migration
node memory-cli.js import --from=.memory/
```

#### Issue: "Embeddings taking too long"

```bash
# Expected for large datasets
# First-time embedding generation:
# - 100 entries: ~30s
# - 1000 entries: ~5min
# - 10000 entries: ~30min

# Progress shown in console
```

### Getting Help

- **Documentation**: See docs/ directory
- **Issues**: https://github.com/SuperPiTT/self-improving-memory-mcp/issues
- **Discussions**: https://github.com/SuperPiTT/self-improving-memory-mcp/discussions

---

## Versioning Policy

- **Major version (X.0.0)**: Breaking changes, major features
- **Minor version (0.X.0)**: New features, backward compatible
- **Patch version (0.0.X)**: Bug fixes, documentation

---

## Upcoming Features (Roadmap)

### v2.1.0 (Planned)
- Graph-based reasoning
- Multi-language support
- Cloud sync (optional)
- Web UI for knowledge browsing

### v2.2.0 (Planned)
- Collaborative knowledge sharing
- Knowledge base merging
- Advanced analytics dashboard
- Custom embedding models

### v3.0.0 (Future)
- Distributed memory system
- Real-time collaboration
- Plugin architecture
- Enterprise features

---

**For more information, see:**
- [README.md](./README.md) - Project overview
- [docs/API.md](./docs/API.md) - Complete API reference
- [docs/INSTALLATION.md](./docs/INSTALLATION.md) - Installation guide
- [GitHub Releases](https://github.com/SuperPiTT/self-improving-memory-mcp/releases) - Download releases
