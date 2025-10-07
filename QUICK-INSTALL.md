# 🚀 Quick Install Guide

Install the self-improving memory system in **any project** in 2 minutes.

---

## Method 1: NPM Global Install (Recommended)

```bash
# Install globally
npm install -g @pytt0n/self-improving-memory-mcp

# Navigate to your project
cd /path/to/your/project

# Run installer
memory-install
```

That's it! The installer will:
- ✅ Create `.claude/` directory with agents
- ✅ Update Claude Desktop config
- ✅ Configure `.gitignore`
- ✅ Set up memory system

**Next:** Restart Claude Desktop and start coding!

---

## Method 2: NPX (No Install)

```bash
# Navigate to your project
cd /path/to/your/project

# Run installer directly
npx @pytt0n/self-improving-memory-mcp memory-install
```

---

## Method 3: Local Install

```bash
# In your project directory
npm install @pytt0n/self-improving-memory-mcp

# The postinstall script runs automatically
# Or run manually:
npx memory-install
```

---

## Verify Installation

After installation, restart Claude Desktop and ask:

```
"Claude, can you see the memory tools?"
```

You should see 18 MCP tools available, including:
- `save_knowledge`
- `search_knowledge`
- `detect_contradictions`
- `generate_insights`
- etc.

---

## What Gets Installed?

### In Your Project:

```
your-project/
├── .claude/
│   ├── agents/              # 10 automatic agents
│   │   ├── pattern-recognition.md
│   │   ├── error-detector.md
│   │   ├── solution-capture.md
│   │   ├── decision-tracker.md
│   │   ├── confidence-evaluator.md
│   │   ├── user-intent-capture.md
│   │   ├── style-preferences.md
│   │   ├── session-context.md
│   │   ├── pre-compact-interceptor.md
│   │   └── context-recovery.md
│   └── CLAUDE.md            # Main configuration
├── .claude-memory/          # Vector database (auto-created)
└── .gitignore               # Updated with memory exclusions
```

### In Claude Desktop Config:

```json
{
  "mcpServers": {
    "memory": {
      "command": "node",
      "args": ["/path/to/package/index.js"],
      "env": {
        "PROJECT_PATH": "/path/to/your/project"
      }
    }
  }
}
```

---

## Configuration Locations

| OS | Claude Desktop Config |
|----|----------------------|
| **macOS** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Linux** | `~/.config/Claude/claude_desktop_config.json` |
| **Windows** | `%APPDATA%/Claude/claude_desktop_config.json` |

---

## Manual Configuration (If Installer Fails)

### 1. Create `.claude` directory

```bash
mkdir -p .claude/agents
```

### 2. Copy agent files

Copy agent files from the package's `.claude/agents/` to your project's `.claude/agents/`

### 3. Update Claude Desktop config manually

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "memory": {
      "command": "node",
      "args": ["/usr/local/lib/node_modules/@pytt0n/self-improving-memory-mcp/index.js"],
      "env": {
        "PROJECT_PATH": "/absolute/path/to/your/project"
      }
    }
  }
}
```

**Note:** Find the package path with:
```bash
npm root -g
# Then append: /@pytt0n/self-improving-memory-mcp/index.js
```

### 4. Restart Claude Desktop

---

## Troubleshooting

### "Tools not showing up in Claude"

1. Verify config file:
   ```bash
   # macOS/Linux
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

   # Windows
   type %APPDATA%\Claude\claude_desktop_config.json
   ```

2. Check if server starts:
   ```bash
   node /path/to/package/index.js
   # Should print: "Self-Improving Memory MCP server running"
   ```

3. Restart Claude Desktop **completely** (Quit, not just close window)

### "Permission denied"

```bash
chmod +x /path/to/memory-install
```

### "Node.js version error"

This package requires Node.js >= 18.

```bash
node --version  # Check current version
```

Upgrade at: https://nodejs.org/

### "Package not found"

If NPM install fails, try:

```bash
npm cache clean --force
npm install -g @pytt0n/self-improving-memory-mcp
```

---

## Uninstall

### Remove from Project:

```bash
rm -rf .claude .claude-memory memory_data cache
```

### Remove from Claude Desktop:

Edit `claude_desktop_config.json` and remove the `"memory"` entry from `mcpServers`.

### Uninstall Package:

```bash
npm uninstall -g @pytt0n/self-improving-memory-mcp
```

---

## Next Steps

Once installed:

1. ✅ **Restart Claude Desktop**
2. ✅ **Verify tools are loaded**: "Claude, can you see memory tools?"
3. ✅ **Start coding** - Agents work automatically!
4. ✅ **Read docs**: Check `.claude/CLAUDE.md` and `docs/` folder

---

## Resources

- 📖 **Full Documentation**: [README.md](README.md)
- 🤖 **Agent Guide**: [docs/AGENTS.md](docs/AGENTS.md)
- 🛠️ **API Reference**: [docs/API.md](docs/API.md)
- 💡 **Best Practices**: [docs/BEST-PRACTICES.md](docs/BEST-PRACTICES.md)
- 🧪 **Testing Guide**: [docs/CHECKPOINT-TESTING.md](docs/CHECKPOINT-TESTING.md)

---

**Questions?** Open an issue: https://github.com/SuperPiTT/self-improving-memory-mcp/issues

**Happy coding with infinite memory! 🧠✨**
