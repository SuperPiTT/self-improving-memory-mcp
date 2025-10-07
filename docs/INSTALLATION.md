# Installation Guide

Complete installation instructions for the Self-Improving Memory MCP Server.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
  - [Quick Install (Recommended)](#quick-install-recommended)
  - [Manual Installation](#manual-installation)
  - [NPM Global Install](#npm-global-install)
- [Configuration](#configuration)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before installing, ensure you have:

- **Node.js**: Version 18.x, 20.x, or 22.x
- **npm**: Version 8.x or higher
- **Operating System**: Ubuntu, Windows, or macOS
- **Disk Space**: ~500MB for dependencies and model (~90MB embedding model)

Check your versions:

```bash
node --version  # Should be 18.x, 20.x, or 22.x
npm --version   # Should be 8.x or higher
```

---

## Installation Methods

### Quick Install (Recommended)

The fastest way to get started:

```bash
# Clone the repository
git clone https://github.com/your-username/self-improving-memory-mcp.git
cd self-improving-memory-mcp

# Run installation script
chmod +x install.sh
./install.sh
```

The install script will:
1. Install all dependencies
2. Run tests to verify installation
3. Configure pre-commit hooks
4. Display usage instructions

### Manual Installation

For more control over the installation process:

```bash
# 1. Clone the repository
git clone https://github.com/your-username/self-improving-memory-mcp.git
cd self-improving-memory-mcp

# 2. Install dependencies
npm install

# 3. Verify installation
npm test

# 4. Set up pre-commit hooks (optional)
npm run prepare
```

### NPM Global Install

Install globally to use from anywhere:

```bash
npm install -g self-improving-memory-mcp

# Verify installation
memory-cli --help
```

---

## Configuration

### MCP Server Configuration

Add the server to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

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

Replace `/path/to/self-improving-memory-mcp` with the actual path to your installation.

### Environment Variables

Configure optional environment variables:

```bash
# Logging level (error, warn, info, debug)
export LOG_LEVEL=info

# Custom memory path (default: .claude-memory)
export MEMORY_PATH=/path/to/custom/memory

# Node environment (development, production)
export NODE_ENV=production
```

Add to your `.bashrc`, `.zshrc`, or `.env` file for persistence.

---

## Verification

### Test Installation

Run the test suite:

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage report
npm run test:coverage
```

Expected output:
```
  137 passing (13s)

Coverage: 85.74% lines, 80.21% branches
```

### Start the Server

Test the MCP server:

```bash
npm start
```

Expected output:
```
[1/3] Initializing VectorStore...
[2/3] Loading embedding model (~90MB)...
[3/3] Connecting to LanceDB...
✓ VectorStore initialized
Self-Improving Memory MCP server running - 100% Vector Search
```

Press `Ctrl+C` to stop.

### Verify CLI Tool

Test the memory CLI:

```bash
node memory-cli.js --help
```

Expected output:
```
Memory CLI - Self-Improving Knowledge Base

Commands:
  search <query>   Search knowledge
  stats           Show statistics
  export          Export to markdown
```

---

## Troubleshooting

### Common Issues

#### Issue: "Module not found" error

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Issue: Tests failing

**Solution:**
```bash
# Check Node.js version
node --version  # Must be 18.x, 20.x, or 22.x

# Run tests with verbose output
npm test -- --reporter spec
```

#### Issue: Embedding model fails to load

**Symptoms:**
```
Error: Failed to load model
```

**Solution:**
```bash
# Ensure internet connection for first download
# Model will be cached after first download (~90MB)

# Clear cache and retry
rm -rf ~/.cache/transformers.js
npm start
```

#### Issue: Permission denied on install.sh

**Solution:**
```bash
chmod +x install.sh
./install.sh
```

#### Issue: EACCES error on global install

**Solution:**
```bash
# Use npm prefix to install without sudo
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH

npm install -g self-improving-memory-mcp
```

### Performance Issues

#### Slow first startup

**Expected behavior:** First startup downloads embedding model (~90MB) and may take 30-60 seconds. Subsequent startups are faster.

#### High memory usage

**Expected:** The system uses ~200-300MB RAM for the embedding model. This is normal.

**To reduce:** Set smaller batch sizes in configuration (advanced users).

### Platform-Specific Issues

#### Windows

- Use Git Bash or WSL for running shell scripts
- Paths use backslashes: `C:\Users\...`
- Pre-commit hooks may require Git Bash

#### macOS

- May require Xcode Command Line Tools: `xcode-select --install`
- First run may prompt for security permissions

#### Linux

- Ensure build tools are installed: `sudo apt-get install build-essential`

---

## Next Steps

After successful installation:

1. **Read the API documentation**: [API.md](./API.md)
2. **Learn MCP commands**: [COMMANDS.md](./COMMANDS.md)
3. **Review best practices**: [BEST-PRACTICES.md](./BEST-PRACTICES.md)
4. **Explore the architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## Uninstallation

To completely remove the system:

```bash
# If installed globally
npm uninstall -g self-improving-memory-mcp

# If installed locally
cd /path/to/self-improving-memory-mcp
rm -rf node_modules .claude-memory

# Remove from Claude Desktop config
# Edit claude_desktop_config.json (see paths in Configuration section) and remove "memory" server
```

---

## Support

- **Documentation**: [README.md](../README.md)
- **Issues**: [GitHub Issues](https://github.com/your-username/self-improving-memory-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/self-improving-memory-mcp/discussions)
