# 🧠 Self-Improving Memory MCP

[![npm version](https://badge.fury.io/js/@pytt0n%2Fself-improving-memory-mcp.svg)](https://www.npmjs.com/package/@pytt0n/self-improving-memory-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

**The most advanced memory system for Claude** with automatic learning, zero context loss, and intelligent analytics.

---

## ⚡ 2-Minute Install

```bash
npm install -g @pytt0n/self-improving-memory-mcp
cd /path/to/your/project
memory-install
```

**Restart Claude Desktop** - Done! 🎉

---

## ✨ What You Get

### 🤖 10 Automatic Agents

Agents that work silently in the background:

- 💬 **User Intent Capture** - Remembers what you want
- 🔍 **Pattern Recognition** - Finds relevant past knowledge
- ❌ **Error Detection** - Captures every error
- ✅ **Solution Capture** - Links solutions to errors
- 📋 **Decision Tracker** - Remembers why you chose X over Y
- 🎨 **Style Preferences** - Learns your coding style
- 💾 **Session Context** - Preserves work across interruptions
- 🚨 **Pre-Compact Interceptor** - Saves state before context loss
- 💡 **Context Recovery** - Restores complete state automatically
- 🎯 **Confidence Evaluator** - Maintains knowledge quality

### 🛡️ Anti-Compaction System

**Problem:** Claude has a 200k token limit. After that, autocompact **deletes** information.

**Our Solution:**
- ✅ Monitors context usage automatically
- ✅ Triggers checkpoint at 80% (160k tokens)
- ✅ Saves **complete** session state to memory
- ✅ Recovers **perfectly** in new conversations
- ✅ **Result:** Infinite conversations, zero loss

### 🧠 Advanced Intelligence

- **Vector Search** - Semantic similarity with embeddings
- **Contradiction Detection** - Finds and resolves conflicts
- **Pattern Analysis** - Discovers emerging themes
- **Auto-Insights** - Generates recommendations
- **Knowledge Graph** - Interactive D3.js visualization

### ⚡ Performance Optimized

- **LRU Cache** - 50%+ hit rate
- **Quantization** - 75% memory reduction (float32 → int8)
- **Batch Processing** - Efficient bulk operations
- **Circuit Breakers** - Graceful error handling

---

## 📊 By The Numbers

| Metric | Value |
|--------|-------|
| **MCP Tools** | 18 tools |
| **Agents** | 10 automatic |
| **Tests** | 263 (100% passing) |
| **Coverage** | >85% |
| **Performance** | 50%+ faster with caching |
| **Memory** | 75% reduction via quantization |

---

## 🚀 Usage

### Installation

```bash
# Global install (recommended)
npm install -g @pytt0n/self-improving-memory-mcp

# Or use npx (no install)
npx @pytt0n/self-improving-memory-mcp memory-install
```

### Configure Your Project

```bash
cd /path/to/your/project
memory-install
```

The installer will:
1. Create `.claude/` directory with agents
2. Update Claude Desktop config automatically
3. Configure `.gitignore` for memory files

### Restart Claude Desktop

Completely quit and restart Claude Desktop.

### Verify

Ask Claude:
```
"Can you see the memory tools?"
```

You should see 18 MCP tools available.

---

## 🛠️ Available Tools

**Core Operations:**
- `save_knowledge` - Save decisions, errors, solutions, patterns
- `search_knowledge` - Semantic vector search
- `link_knowledge` - Connect related knowledge
- `get_stats` - View knowledge base statistics

**Advanced Features:**
- `export_graph` - Visualize knowledge (HTML, JSON, DOT, D3, Cytoscape)
- `detect_contradictions` - Find conflicting knowledge
- `auto_resolve_contradictions` - Resolve conflicts by confidence
- `analyze_patterns` - Discover frequency patterns
- `generate_insights` - Get AI-powered recommendations
- `cluster_knowledge` - Semantic clustering

**Performance:**
- `get_cache_stats` - View cache hit rates
- `clear_cache` - Reset embedding cache
- `persist_cache` - Save cache to disk

---

## 📖 Documentation

- 📘 [Quick Install Guide](https://github.com/SuperPiTT/self-improving-memory-mcp/blob/main/QUICK-INSTALL.md)
- 📗 [Full Installation](https://github.com/SuperPiTT/self-improving-memory-mcp/blob/main/docs/INSTALLATION.md)
- 📙 [API Reference](https://github.com/SuperPiTT/self-improving-memory-mcp/blob/main/docs/API.md)
- 📕 [Best Practices](https://github.com/SuperPiTT/self-improving-memory-mcp/blob/main/docs/BEST-PRACTICES.md)
- 📓 [Checkpoint Testing](https://github.com/SuperPiTT/self-improving-memory-mcp/blob/main/docs/CHECKPOINT-TESTING.md)

---

## 💡 How It Works

### Automatic Learning Cycle

```
User Request
    ↓
User Intent Capture  (saves what you want)
    ↓
Pattern Recognition  (finds past knowledge)
    ↓
Work Execution
    ↓
Error Detection     (if error occurs)
    ↓
Solution Capture    (when resolved)
    ↓
Decision Tracker    (records choices)
    ↓
Style Preferences   (learns patterns)
    ↓
Knowledge Base Grows Automatically
```

### Context Preservation

```
Conversation reaches 80% (160k tokens)
    ↓
Pre-Compact Interceptor activates
    ↓
Complete state saved to vector DB
    ↓
User gets continuation summary
    ↓
User starts new conversation
    ↓
Context Recovery auto-loads state
    ↓
Continue exactly where left off - Zero loss!
```

---

## 🔧 Requirements

- **Node.js** >= 18.0.0
- **Claude Desktop** (with MCP support)
- **Disk Space** ~200MB for embeddings model

---

## 🐛 Troubleshooting

### Tools not showing in Claude?

1. Check Claude Desktop config:
   ```bash
   # macOS
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

   # Linux
   cat ~/.config/Claude/claude_desktop_config.json

   # Windows
   type %APPDATA%\Claude\claude_desktop_config.json
   ```

2. Verify server starts:
   ```bash
   node $(npm root -g)/@pytt0n/self-improving-memory-mcp/index.js
   ```

3. **Fully quit and restart Claude Desktop** (not just close window)

### Permission errors?

```bash
chmod +x $(which memory-install)
```

### More help?

See [Troubleshooting Guide](https://github.com/SuperPiTT/self-improving-memory-mcp/blob/main/QUICK-INSTALL.md#troubleshooting)

---

## 🤝 Contributing

Contributions welcome! Please see [CONTRIBUTING.md](https://github.com/SuperPiTT/self-improving-memory-mcp/blob/main/CONTRIBUTING.md)

---

## 📄 License

MIT © [Pytt0n](https://github.com/SuperPiTT)

---

## 🌟 Star the Project

If this project helps you, please ⭐ star it on GitHub!

https://github.com/SuperPiTT/self-improving-memory-mcp

---

**Made with ❤️ by Pytt0n (with help from Claude)**

**Questions?** [Open an issue](https://github.com/SuperPiTT/self-improving-memory-mcp/issues)
