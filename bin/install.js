#!/usr/bin/env node

/**
 * Interactive installer for Self-Improving Memory MCP
 * Makes it super easy to add to any project
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

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

// Detect OS and get config path
function getClaudeConfigPath() {
  const platform = process.platform;
  const home = process.env.HOME || process.env.USERPROFILE;

  switch (platform) {
    case 'darwin': // macOS
      return path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    case 'linux':
      return path.join(home, '.config', 'Claude', 'claude_desktop_config.json');
    case 'win32': // Windows
      return path.join(process.env.APPDATA, 'Claude', 'claude_desktop_config.json');
    default:
      return null;
  }
}

// Ask user for input
function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Check if Node.js version is compatible
function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.split('.')[0].substring(1));

  if (major < 18) {
    logError(`Node.js ${version} detected. This package requires Node.js >= 18`);
    logInfo('Please upgrade Node.js: https://nodejs.org/');
    process.exit(1);
  }

  logSuccess(`Node.js ${version} detected`);
}

// Create .claude directory in project
function createClaudeDirectory(projectPath) {
  const claudeDir = path.join(projectPath, '.claude');

  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
    logSuccess('Created .claude directory');
  } else {
    logInfo('.claude directory already exists');
  }

  return claudeDir;
}

// Copy agent files to project
function copyAgentFiles(projectPath) {
  const sourceAgentsDir = path.join(__dirname, '..', '.claude', 'agents');
  const targetAgentsDir = path.join(projectPath, '.claude', 'agents');

  if (!fs.existsSync(sourceAgentsDir)) {
    logWarning('Agent files not found in package. Skipping...');
    return;
  }

  if (!fs.existsSync(targetAgentsDir)) {
    fs.mkdirSync(targetAgentsDir, { recursive: true });
  }

  const agents = fs.readdirSync(sourceAgentsDir);
  agents.forEach(agent => {
    const source = path.join(sourceAgentsDir, agent);
    const target = path.join(targetAgentsDir, agent);
    fs.copyFileSync(source, target);
  });

  logSuccess(`Copied ${agents.length} agent files`);
}

// Copy CLAUDE.md to project
function copyCLAUDEmd(projectPath) {
  const sourceCLAUDE = path.join(__dirname, '..', '.claude', 'CLAUDE.md');
  const targetCLAUDE = path.join(projectPath, '.claude', 'CLAUDE.md');

  if (!fs.existsSync(sourceCLAUDE)) {
    logWarning('CLAUDE.md not found in package. Skipping...');
    return;
  }

  fs.copyFileSync(sourceCLAUDE, targetCLAUDE);
  logSuccess('Copied CLAUDE.md configuration');
}

// Update or create Claude Desktop config
function updateClaudeConfig(projectPath) {
  const configPath = getClaudeConfigPath();

  if (!configPath) {
    logError('Could not detect Claude Desktop config path for your OS');
    logInfo('Please configure manually. See docs/INSTALLATION.md');
    return;
  }

  log('\n📝 Claude Desktop Configuration', 'cyan');
  logInfo(`Config path: ${configPath}`);

  // Create config directory if it doesn't exist
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
    logSuccess('Created Claude Desktop config directory');
  }

  // Read or create config
  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      logInfo('Existing config found');

      // Backup existing config
      const backupPath = `${configPath}.backup-${Date.now()}`;
      fs.copyFileSync(configPath, backupPath);
      logSuccess(`Backup created: ${backupPath}`);
    } catch (error) {
      logWarning('Could not parse existing config, creating new one');
    }
  }

  // Add or update memory server
  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  // Get the path to the globally installed package
  const globalNodeModules = execSync('npm root -g', { encoding: 'utf-8' }).trim();
  const packagePath = path.join(globalNodeModules, 'self-improving-memory-mcp');

  config.mcpServers.memory = {
    command: 'node',
    args: [path.join(packagePath, 'index.js')],
    env: {
      PROJECT_PATH: projectPath
    }
  };

  // Write updated config
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  logSuccess('Updated Claude Desktop config');
}

// Create .gitignore entries
function updateGitignore(projectPath) {
  const gitignorePath = path.join(projectPath, '.gitignore');
  const entries = [
    '',
    '# Self-Improving Memory MCP',
    '.claude-memory/',
    'memory_data/',
    'cache/',
  ].join('\n');

  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    if (!content.includes('.claude-memory/')) {
      fs.appendFileSync(gitignorePath, entries);
      logSuccess('Updated .gitignore');
    } else {
      logInfo('.gitignore already configured');
    }
  } else {
    fs.writeFileSync(gitignorePath, entries);
    logSuccess('Created .gitignore');
  }
}

// Main installation flow
async function install() {
  log('\n🧠 Self-Improving Memory MCP - Installation\n', 'bright');
  log('='.repeat(50), 'cyan');
  log('');

  // Step 1: Check Node.js version
  log('Step 1: Checking Node.js version...', 'yellow');
  checkNodeVersion();
  log('');

  // Step 2: Detect project path
  log('Step 2: Configuring project...', 'yellow');
  const projectPath = process.cwd();
  logInfo(`Project path: ${projectPath}`);
  log('');

  // Step 3: Ask user if they want to continue
  const answer = await askQuestion('Install memory system in this project? (y/n): ');
  if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
    logInfo('Installation cancelled');
    process.exit(0);
  }
  log('');

  // Step 4: Create .claude directory
  log('Step 3: Setting up .claude directory...', 'yellow');
  createClaudeDirectory(projectPath);
  log('');

  // Step 5: Copy agent files
  log('Step 4: Installing agent files...', 'yellow');
  copyAgentFiles(projectPath);
  copyCLAUDEmd(projectPath);
  log('');

  // Step 6: Update .gitignore
  log('Step 5: Configuring .gitignore...', 'yellow');
  updateGitignore(projectPath);
  log('');

  // Step 7: Update Claude Desktop config
  log('Step 6: Configuring Claude Desktop...', 'yellow');
  updateClaudeConfig(projectPath);
  log('');

  // Success message
  log('='.repeat(50), 'cyan');
  log('\n✅ Installation Complete!\n', 'green');
  log('Next steps:', 'bright');
  log('  1. Restart Claude Desktop completely', 'cyan');
  log('  2. Open Claude and verify tools are available:', 'cyan');
  log('     "Claude, can you see the memory tools?"', 'cyan');
  log('  3. Start using the memory system automatically!', 'cyan');
  log('');
  log('Documentation:', 'bright');
  log('  • README: https://github.com/your-repo/README.md', 'blue');
  log('  • Agents: Check .claude/agents/ folder', 'blue');
  log('  • Config: Check .claude/CLAUDE.md', 'blue');
  log('');
  log('🎉 Happy coding with infinite memory!', 'green');
  log('');
}

// Run installer
install().catch((error) => {
  logError('Installation failed:');
  console.error(error);
  process.exit(1);
});
