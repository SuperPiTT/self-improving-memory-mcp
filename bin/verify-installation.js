#!/usr/bin/env node

/**
 * Verification script for Self-Improving Memory MCP installation
 * Checks that all required files and dependencies are in place
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

/**
 * Check if a file exists
 */
function checkFile(filePath, description, required = true) {
  const exists = fs.existsSync(filePath);

  if (exists) {
    logSuccess(`${description}: ${filePath}`);
    return true;
  } else {
    if (required) {
      logError(`${description} NOT FOUND: ${filePath}`);
    } else {
      logWarning(`${description} not found (optional): ${filePath}`);
    }
    return false;
  }
}

/**
 * Check if a directory exists
 */
function checkDirectory(dirPath, description, required = true) {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();

  if (exists) {
    logSuccess(`${description}: ${dirPath}`);
    return true;
  } else {
    if (required) {
      logError(`${description} NOT FOUND: ${dirPath}`);
    } else {
      logWarning(`${description} not found (optional): ${dirPath}`);
    }
    return false;
  }
}

/**
 * Check if node_modules dependencies are installed
 */
function checkDependencies(packagePath) {
  const packageJsonPath = path.join(packagePath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    logError(`package.json not found at ${packageJsonPath}`);
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const dependencies = packageJson.dependencies || {};

  log('\n📦 Checking dependencies...', 'cyan');

  let allOk = true;
  for (const [dep, version] of Object.entries(dependencies)) {
    const depPath = path.join(packagePath, 'node_modules', dep);
    if (checkDirectory(depPath, `  ${dep}@${version}`, true)) {
      // OK
    } else {
      allOk = false;
    }
  }

  return allOk;
}

/**
 * Main verification function
 */
function verify() {
  log('\n🔍 Self-Improving Memory MCP - Installation Verification\n', 'bright');
  log('='.repeat(60), 'cyan');
  log('');

  const projectPath = process.cwd();
  const packagePath = path.join(__dirname, '..');

  logInfo(`Project path: ${projectPath}`);
  logInfo(`Package path: ${packagePath}`);
  log('');

  let errors = 0;
  let warnings = 0;

  // ==================== CORE FILES ====================
  log('📄 Core Files:', 'cyan');

  if (!checkFile(path.join(packagePath, 'index.js'), 'MCP Server entry point', true)) errors++;
  if (!checkFile(path.join(packagePath, 'memory-cli.js'), 'CLI tool', true)) errors++;
  if (!checkFile(path.join(packagePath, 'package.json'), 'package.json', true)) errors++;
  if (!checkFile(path.join(packagePath, 'bin', 'install.js'), 'Installer script', true)) errors++;

  log('');

  // ==================== SOURCE MODULES ====================
  log('📂 Source Modules:', 'cyan');

  if (!checkDirectory(path.join(packagePath, 'src'), 'src/ directory', true)) errors++;
  if (!checkFile(path.join(packagePath, 'src', 'knowledge-store.js'), 'Knowledge Store', true)) errors++;
  if (!checkFile(path.join(packagePath, 'src', 'vector-store.js'), 'Vector Store', true)) errors++;
  if (!checkFile(path.join(packagePath, 'src', 'mcp-server.js'), 'MCP Server', true)) errors++;

  log('');

  // ==================== UTILITIES ====================
  log('🔧 Utility Modules:', 'cyan');

  if (!checkDirectory(path.join(packagePath, 'src', 'utils'), 'src/utils/ directory', true)) errors++;
  if (!checkFile(path.join(packagePath, 'src', 'utils', 'logger.js'), 'Logger', true)) errors++;
  if (!checkFile(path.join(packagePath, 'src', 'utils', 'embeddings.js'), 'Embeddings', true)) errors++;
  if (!checkFile(path.join(packagePath, 'src', 'utils', 'cache.js'), 'Cache', true)) errors++;
  if (!checkFile(path.join(packagePath, 'src', 'utils', 'graph.js'), 'Graph utils', true)) errors++;
  if (!checkFile(path.join(packagePath, 'src', 'utils', 'contradiction.js'), 'Contradiction detector', true)) errors++;
  if (!checkFile(path.join(packagePath, 'src', 'utils', 'patterns.js'), 'Pattern matcher', true)) errors++;
  if (!checkFile(path.join(packagePath, 'src', 'utils', 'performance.js'), 'Performance monitor', true)) errors++;
  if (!checkFile(path.join(packagePath, 'src', 'utils', 'retry.js'), 'Retry logic', true)) errors++;

  log('');

  // ==================== SCHEMAS ====================
  log('📋 Schemas:', 'cyan');

  if (!checkDirectory(path.join(packagePath, 'src', 'schemas'), 'src/schemas/ directory', true)) errors++;
  if (!checkFile(path.join(packagePath, 'src', 'schemas', 'validation.js'), 'Validation schemas', true)) errors++;

  log('');

  // ==================== CLAUDE CONFIGURATION ====================
  log('🤖 Claude Configuration:', 'cyan');

  if (!checkDirectory(path.join(packagePath, '.claude'), '.claude/ directory', true)) errors++;
  if (!checkFile(path.join(packagePath, '.claude', 'CLAUDE.md'), 'CLAUDE.md', true)) errors++;

  log('');

  // ==================== AGENTS ====================
  log('🎯 Agent Files:', 'cyan');

  const agentsDir = path.join(packagePath, '.claude', 'agents');
  if (checkDirectory(agentsDir, '.claude/agents/ directory', true)) {
    const expectedAgents = [
      'context-recovery.md',
      'decision-tracker.md',
      'error-detector.md',
      'pattern-recognition.md',
      'pre-compact-interceptor.md',
      'session-context.md',
      'solution-capture.md',
      'style-preferences.md',
      'user-intent-capture.md',
      'confidence-evaluator.md',
    ];

    for (const agent of expectedAgents) {
      if (!checkFile(path.join(agentsDir, agent), `  ${agent}`, true)) errors++;
    }
  } else {
    errors++;
  }

  log('');

  // ==================== COMMANDS ====================
  log('⚡ Command Files:', 'cyan');

  const commandsDir = path.join(packagePath, '.claude', 'commands');
  if (checkDirectory(commandsDir, '.claude/commands/ directory', true)) {
    const commands = fs.readdirSync(commandsDir);
    if (commands.length > 0) {
      logSuccess(`  Found ${commands.length} command(s)`);
      commands.forEach(cmd => {
        checkFile(path.join(commandsDir, cmd), `  ${cmd}`, false);
      });
    } else {
      logWarning('  No command files found (optional)');
    }
  } else {
    errors++;
  }

  log('');

  // ==================== DEPENDENCIES ====================
  if (!checkDependencies(packagePath)) {
    errors++;
  }

  log('');

  // ==================== PROJECT CONFIGURATION ====================
  log('🔧 Project Configuration:', 'cyan');

  // Check Claude Code config
  const claudeCodeConfig = path.join(projectPath, '.claude', 'mcp.json');
  if (fs.existsSync(path.join(projectPath, '.claude'))) {
    if (checkFile(claudeCodeConfig, 'Claude Code mcp.json', false)) {
      // Validate JSON
      try {
        const config = JSON.parse(fs.readFileSync(claudeCodeConfig, 'utf-8'));
        if (config.mcpServers && config.mcpServers.memory) {
          logSuccess('  Memory server configured in mcp.json');
        } else {
          logWarning('  mcp.json exists but memory server not configured');
          warnings++;
        }
      } catch (e) {
        logError(`  mcp.json is invalid JSON: ${e.message}`);
        errors++;
      }
    } else {
      logWarning('  Claude Code detected but mcp.json not found');
      warnings++;
    }
  }

  // Check .gitignore
  const gitignorePath = path.join(projectPath, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    if (gitignoreContent.includes('.claude-memory/')) {
      logSuccess('.gitignore configured');
    } else {
      logWarning('.gitignore exists but memory entries not added');
      warnings++;
    }
  } else {
    logWarning('.gitignore not found in project');
    warnings++;
  }

  log('');

  // ==================== SUMMARY ====================
  log('='.repeat(60), 'cyan');
  log('');

  if (errors === 0 && warnings === 0) {
    log('✅ VERIFICATION PASSED - All checks successful!\n', 'green');
    log('Installation is complete and all required files are in place.', 'cyan');
    log('');
    return 0;
  } else if (errors === 0) {
    log(`⚠️  VERIFICATION PASSED WITH WARNINGS (${warnings} warning(s))\n`, 'yellow');
    log('Installation is functional but some optional items are missing.', 'cyan');
    log('');
    return 0;
  } else {
    log(`❌ VERIFICATION FAILED - ${errors} error(s), ${warnings} warning(s)\n`, 'red');
    log('Installation is incomplete. Please reinstall:', 'red');
    log('  npm install -g @pytt0n/self-improving-memory-mcp', 'cyan');
    log('  memory-install', 'cyan');
    log('');
    return 1;
  }
}

// Run verification
const exitCode = verify();
process.exit(exitCode);
