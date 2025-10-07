#!/bin/bash

# Publishing script for @pit-code/self-improving-memory-mcp
# Ensures everything is ready before publishing to NPM

set -e  # Exit on error

echo "🚀 Publishing Self-Improving Memory MCP"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if logged in to npm
echo "📝 Checking NPM authentication..."
if ! npm whoami > /dev/null 2>&1; then
    echo -e "${RED}✗ Not logged in to NPM${NC}"
    echo "Run: npm login"
    exit 1
fi
echo -e "${GREEN}✓ Logged in as: $(npm whoami)${NC}"
echo ""

# Check git status
echo "📋 Checking git status..."
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}⚠ You have uncommitted changes${NC}"
    echo "Uncommitted files:"
    git status --short
    echo ""
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Publishing cancelled"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Working directory clean${NC}"
fi
echo ""

# Run tests
echo "🧪 Running tests..."
if ! npm test; then
    echo -e "${RED}✗ Tests failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ All tests passed${NC}"
echo ""

# Check version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Current version: $CURRENT_VERSION"
echo ""

# Ask for version bump
echo "Select version bump:"
echo "  1) patch (2.0.0 → 2.0.1) - Bug fixes"
echo "  2) minor (2.0.0 → 2.1.0) - New features"
echo "  3) major (2.0.0 → 3.0.0) - Breaking changes"
echo "  4) Skip version bump"
echo ""
read -p "Choose (1-4): " -n 1 -r
echo ""

case $REPLY in
    1)
        npm version patch
        ;;
    2)
        npm version minor
        ;;
    3)
        npm version major
        ;;
    4)
        echo "Skipping version bump"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

NEW_VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}✓ Version: $NEW_VERSION${NC}"
echo ""

# Build step (if needed)
# echo "🔨 Building..."
# npm run build
# echo ""

# Dry run
echo "📦 Running publish dry-run..."
if ! npm publish --dry-run --access public; then
    echo -e "${RED}✗ Dry run failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dry run successful${NC}"
echo ""

# Final confirmation
echo "Ready to publish:"
echo "  Package: @pit-code/self-improving-memory-mcp"
echo "  Version: $NEW_VERSION"
echo "  Registry: https://registry.npmjs.org/"
echo ""
read -p "Publish to NPM? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Publishing cancelled"
    exit 1
fi

# Publish!
echo ""
echo "📤 Publishing to NPM..."
if npm publish --access public; then
    echo ""
    echo -e "${GREEN}✅ Published successfully!${NC}"
    echo ""
    echo "View on NPM:"
    echo "  https://www.npmjs.com/package/@pit-code/self-improving-memory-mcp"
    echo ""
    echo "Install with:"
    echo "  npm install -g @pit-code/self-improving-memory-mcp"
    echo ""

    # Tag git commit
    git tag "v$NEW_VERSION"
    echo -e "${GREEN}✓ Created git tag: v$NEW_VERSION${NC}"
    echo ""
    echo "Push tags with:"
    echo "  git push --tags"
else
    echo -e "${RED}✗ Publishing failed${NC}"
    exit 1
fi
