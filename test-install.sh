#!/bin/bash

# Test installation script
# Creates a temporary project and tests the installer

set -e

echo "🧪 Testing Self-Improving Memory MCP Installation"
echo "=================================================="
echo ""

# Create temp directory
TEMP_DIR=$(mktemp -d)
TEST_PROJECT="$TEMP_DIR/test-project"

echo "📁 Creating test project at: $TEST_PROJECT"
mkdir -p "$TEST_PROJECT/.claude"
cd "$TEST_PROJECT"

# Initialize minimal project
echo '{"name": "test-project", "version": "1.0.0"}' > package.json
echo "# Test Project" > .claude/CLAUDE.md
echo "This is my project's custom instructions." >> .claude/CLAUDE.md

echo "✅ Test project created"
echo ""

# Run installer (simulate 'yes' answer)
echo "🚀 Running installer..."
echo "y" | node /home/pit/proyectos/self-improving-memory-mcp/bin/install.js

echo ""
echo "🔍 Verifying installation..."
echo ""

# Check files
ERRORS=0

check_file() {
  if [ -f "$1" ]; then
    echo "  ✅ $1"
  else
    echo "  ❌ $1 - MISSING"
    ((ERRORS++))
  fi
}

check_dir() {
  if [ -d "$1" ]; then
    echo "  ✅ $1/"
  else
    echo "  ❌ $1/ - MISSING"
    ((ERRORS++))
  fi
}

check_dir ".claude/agents"
check_file ".claude/CLAUDE.md"
check_file ".claude/mcp.json"
check_file ".claude/settings.json"
check_dir ".claude/hooks"
check_dir ".claude/lib"
check_dir ".claude/commands"
check_dir ".claude/memory-storage"

echo ""

# Check CLAUDE.md content
if grep -q "Self-Improving Memory System" .claude/CLAUDE.md; then
  echo "  ✅ CLAUDE.md extended with memory instructions"
else
  echo "  ❌ CLAUDE.md NOT extended"
  ((ERRORS++))
fi

if grep -q "This is my project's custom instructions" .claude/CLAUDE.md; then
  echo "  ✅ CLAUDE.md preserves original content"
else
  echo "  ❌ CLAUDE.md original content LOST"
  ((ERRORS++))
fi

# Check agents
AGENT_COUNT=$(ls -1 .claude/agents/*.md 2>/dev/null | wc -l)
if [ "$AGENT_COUNT" -gt 5 ]; then
  echo "  ✅ Found $AGENT_COUNT agent files"
else
  echo "  ❌ Only $AGENT_COUNT agent files (expected >5)"
  ((ERRORS++))
fi

# Check NO .claude-mcp directory
if [ ! -d ".claude-mcp" ]; then
  echo "  ✅ No .claude-mcp directory (good - using standard location)"
else
  echo "  ❌ .claude-mcp directory exists (should not)"
  ((ERRORS++))
fi

echo ""
echo "=================================================="

if [ $ERRORS -eq 0 ]; then
  echo "✅ ALL TESTS PASSED!"
  echo ""
  echo "Cleanup: $TEMP_DIR"
  rm -rf "$TEMP_DIR"
  exit 0
else
  echo "❌ $ERRORS TEST(S) FAILED"
  echo ""
  echo "Test project preserved for inspection: $TEST_PROJECT"
  exit 1
fi
