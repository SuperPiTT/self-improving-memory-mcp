# Contributing to Self-Improving Memory System

Thank you for your interest in contributing! This project aims to make Claude's memory persistent and continuously improving.

## 🎯 Project Principles

Before contributing, please understand our core principles:

- **Automatic, not manual** - The system should learn without user intervention
- **Files under 500 lines** - We follow SOLID principles and modular design
- **Clear documentation** - Every feature needs docs with references
- **Test critical paths** - All core functionality must be tested
- **Zero context loss** - The anti-compaction system is our top priority

## 🚀 Getting Started

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then:
   git clone https://github.com/YOUR_USERNAME/self-improving-memory-mcp.git
   cd self-improving-memory-mcp
   npm install
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

3. **Make your changes**
   - Follow existing code style
   - Keep files modular and focused
   - Add tests for new features
   - Update documentation

4. **Test your changes**
   ```bash
   npm test                    # Run all tests
   npm run test:unit          # Unit tests only
   npm run test:integration   # Integration tests
   npm run test:coverage      # Coverage report
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   # or "fix:", "docs:", "refactor:", etc.
   git push origin your-branch-name
   ```

6. **Open a Pull Request**
   - Go to GitHub and create a PR
   - Describe what changed and why
   - Reference related issues if applicable

## 📋 Contribution Areas

### 🐛 Bug Fixes
- Check [existing issues](https://github.com/SuperPiTT/self-improving-memory-mcp/issues)
- Reproduce the bug
- Fix it and add a test
- Submit PR with clear description

### ✨ New Features
- Check [ROADMAP.md](ROADMAP.md) for planned features
- Open an issue to discuss before implementing
- Ensure it aligns with project principles
- Add tests and documentation

### 📖 Documentation
- Fix typos or unclear explanations
- Add examples or use cases
- Improve installation guides
- Translate to other languages

### 🧪 Testing
- Add missing test coverage
- Improve existing tests
- Add integration tests
- Create test scenarios for edge cases

## 🎨 Code Style

### JavaScript
- ES6+ modules (`import`/`export`)
- Async/await over callbacks
- Descriptive variable names
- Comments for complex logic
- Max 500 lines per file

### Documentation
- Clear headings and structure
- Code examples where helpful
- References to other docs with links
- Emojis for visual navigation (used consistently)

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new agent for code quality analysis
fix: resolve vector search timeout issue
docs: update installation guide for Windows
refactor: simplify knowledge store API
test: add integration tests for MCP tools
```

## 🧪 Testing Guidelines

### What to Test
- **Critical paths**: All MCP tools, agents, vector operations
- **Edge cases**: Empty results, malformed input, large datasets
- **Integrations**: LanceDB, Transformers.js, MCP SDK
- **Anti-compaction**: Checkpoint save/restore workflows

### Test Structure
```javascript
describe('Feature/Component Name', () => {
  it('should do something specific', async () => {
    // Arrange
    const input = setupTestData();

    // Act
    const result = await functionUnderTest(input);

    // Assert
    expect(result).to.deep.equal(expectedOutput);
  });
});
```

## 📦 Pull Request Checklist

Before submitting your PR, ensure:

- [ ] Code follows project style
- [ ] All tests pass (`npm test`)
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] No breaking changes (or clearly documented)
- [ ] Files remain under 500 lines
- [ ] No unnecessary dependencies added

## 🔍 Review Process

1. **Automated checks** run on PR (tests, linting)
2. **Maintainer review** within 1-3 days
3. **Feedback** may request changes
4. **Approval** and merge once ready

## 🌟 Recognition

Contributors are recognized in:
- GitHub contributors list
- Release notes for significant changes
- Special thanks in README for major features

## 🤝 Code of Conduct

- Be respectful and constructive
- Welcome newcomers and help them learn
- Focus on what's best for the project
- Assume good intentions

## 💡 Questions?

- Open an [issue](https://github.com/SuperPiTT/self-improving-memory-mcp/issues) for questions
- Check [existing documentation](docs/)
- Review [closed issues](https://github.com/SuperPiTT/self-improving-memory-mcp/issues?q=is%3Aissue+is%3Aclosed) for similar questions

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for making Claude's memory better!** 🧠✨
