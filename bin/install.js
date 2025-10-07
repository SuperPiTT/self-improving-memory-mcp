#!/usr/bin/env node

/**
 * Interactive installer for Self-Improving Memory MCP
 * Makes it super easy to add to any project
 */

import { execSync, spawnSync } from 'child_process';
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

// Create .claude-mcp directory in project (for custom mode)
function createClaudeDirectory(projectPath) {
  const claudeDir = path.join(projectPath, '.claude-mcp');

  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
    logSuccess('Created .claude-mcp directory');
  } else {
    logInfo('.claude-mcp directory already exists');
  }

  return claudeDir;
}

// Copy agent files to project (custom mode)
function copyAgentFiles(projectPath) {
  const sourceAgentsDir = path.join(__dirname, '..', '.claude', 'agents');
  const targetAgentsDir = path.join(projectPath, '.claude-mcp', 'agents');

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

  logSuccess(`Copied ${agents.length} agent files to .claude-mcp/agents/`);
}

// Copy CLAUDE.md to project (custom mode)
function copyCLAUDEmd(projectPath) {
  const sourceCLAUDE = path.join(__dirname, '..', '.claude', 'CLAUDE.md');
  const targetCLAUDE = path.join(projectPath, '.claude-mcp', 'CLAUDE.md');

  if (!fs.existsSync(sourceCLAUDE)) {
    logWarning('CLAUDE.md not found in package. Skipping...');
    return;
  }

  fs.copyFileSync(sourceCLAUDE, targetCLAUDE);
  logSuccess('Copied CLAUDE.md configuration to .claude-mcp/');
}

// Copy command files to project .claude/commands
function copyCommandFiles(projectPath) {
  const sourceCommandsDir = path.join(__dirname, '..', '.claude', 'commands');
  const targetCommandsDir = path.join(projectPath, '.claude', 'commands');

  if (!fs.existsSync(sourceCommandsDir)) {
    logWarning('Command files not found in package. Skipping...');
    return;
  }

  // Check if .claude/commands exists
  if (!fs.existsSync(targetCommandsDir)) {
    fs.mkdirSync(targetCommandsDir, { recursive: true });
    logInfo('Created .claude/commands directory');
  }

  const commands = fs.readdirSync(sourceCommandsDir);
  let copiedCount = 0;
  let skippedCount = 0;

  commands.forEach(command => {
    const source = path.join(sourceCommandsDir, command);
    const target = path.join(targetCommandsDir, command);

    // Skip if file already exists (don't overwrite user customizations)
    if (fs.existsSync(target)) {
      skippedCount++;
      return;
    }

    fs.copyFileSync(source, target);
    copiedCount++;
  });

  if (copiedCount > 0) {
    logSuccess(`Copied ${copiedCount} command file(s) to .claude/commands/`);
  }
  if (skippedCount > 0) {
    logInfo(`Skipped ${skippedCount} existing command file(s)`);
  }
}

// Copy statusline scripts to project .claude/lib
function copyStatuslineScripts(projectPath) {
  const sourceLibDir = path.join(__dirname, '..', '.claude', 'lib');
  const targetLibDir = path.join(projectPath, '.claude', 'lib');

  if (!fs.existsSync(sourceLibDir)) {
    logWarning('Statusline scripts not found in package. Skipping...');
    return;
  }

  // Check if .claude/lib exists
  if (!fs.existsSync(targetLibDir)) {
    fs.mkdirSync(targetLibDir, { recursive: true });
    logInfo('Created .claude/lib directory');
  }

  const scripts = fs.readdirSync(sourceLibDir).filter(f => f.startsWith('statusline-'));
  let copiedCount = 0;

  scripts.forEach(script => {
    const source = path.join(sourceLibDir, script);
    const target = path.join(targetLibDir, script);

    // Copy and make executable
    fs.copyFileSync(source, target);
    fs.chmodSync(target, 0o755);
    copiedCount++;
  });

  if (copiedCount > 0) {
    logSuccess(`Copied ${copiedCount} statusline script(s) to .claude/lib/`);
  }
}

// Copy hook scripts to project .claude/hooks
function copyHooks(projectPath) {
  const sourceHooksDir = path.join(__dirname, '..', '.claude', 'hooks');
  const targetHooksDir = path.join(projectPath, '.claude', 'hooks');

  if (!fs.existsSync(sourceHooksDir)) {
    logWarning('Hook scripts not found in package. Skipping...');
    return;
  }

  // Check if .claude/hooks exists
  if (!fs.existsSync(targetHooksDir)) {
    fs.mkdirSync(targetHooksDir, { recursive: true });
    logInfo('Created .claude/hooks directory');
  }

  const hooks = fs.readdirSync(sourceHooksDir);
  let copiedCount = 0;

  hooks.forEach(hook => {
    const source = path.join(sourceHooksDir, hook);
    const target = path.join(targetHooksDir, hook);

    // Copy and make executable
    fs.copyFileSync(source, target);
    fs.chmodSync(target, 0o755);
    copiedCount++;
  });

  if (copiedCount > 0) {
    logSuccess(`Copied ${copiedCount} hook script(s) to .claude/hooks/`);
  }
}

// Configure statusline and hooks in settings.json
async function configureSettings(projectPath) {
  const settingsPath = path.join(projectPath, '.claude', 'settings.json');
  let settings = {};

  // Read existing settings
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      logInfo('Existing settings.json found');
    } catch (error) {
      logWarning('Could not parse existing settings.json, creating new one');
    }
  }

  // Check if statusLine already configured
  let updateStatusLine = true;
  if (settings.statusLine) {
    logInfo('Status line already configured');
    const answer = await askQuestion('Update status line configuration? (y/n): ');
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      logInfo('Skipping status line configuration');
      updateStatusLine = false;
    }
  }

  if (updateStatusLine) {
    // Configure statusline (use local copy)
    settings.statusLine = {
      type: 'command',
      command: '.claude/lib/statusline-context-monitor.sh'
    };
    logSuccess('Configured context monitor in status line');
    logInfo('Tip: Edit .claude/settings.json to switch to advanced version or disable');
  }

  // Check if hooks already configured
  let updateHooks = true;
  if (settings.hooks && settings.hooks.UserPromptSubmit) {
    logInfo('Context guard hook already configured');
    const answer = await askQuestion('Update hook configuration? (y/n): ');
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      logInfo('Skipping hook configuration');
      updateHooks = false;
    }
  }

  if (updateHooks) {
    // Configure hooks
    if (!settings.hooks) {
      settings.hooks = {};
    }

    // UserPromptSubmit: Context guard for automatic checkpoint
    settings.hooks.UserPromptSubmit = [
      {
        hooks: [
          {
            type: 'command',
            command: '.claude/hooks/context-guard.sh'
          }
        ]
      }
    ];

    // PreToolUse: Agent start notifications (for Task tool)
    settings.hooks.PreToolUse = [
      {
        matcher: 'Task',
        hooks: [
          {
            type: 'command',
            command: '.claude/hooks/agent-start.sh'
          }
        ]
      }
    ];

    // PostToolUse: Agent completion notifications (for Task tool)
    settings.hooks.PostToolUse = [
      {
        matcher: 'Task',
        hooks: [
          {
            type: 'command',
            command: '.claude/hooks/agent-complete.sh'
          }
        ]
      }
    ];

    logSuccess('Configured automatic checkpoint trigger at 80% context');
    logSuccess('Configured agent visualization (start/complete notifications)');
    logInfo('Hooks: context-guard, agent-start, agent-complete');
  }

  // Write settings
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

// Update or create Claude Code config (mcp.json)
async function updateClaudeCodeConfig(projectPath) {
  log('\n📝 Claude Code Configuration', 'cyan');

  // Check if .claude directory exists
  const claudeDir = path.join(projectPath, '.claude');
  if (!fs.existsSync(claudeDir)) {
    logWarning('.claude directory not found - this may not be a Claude Code project');
    logInfo('Skipping Claude Code configuration');
    return false;
  }

  const mcpConfigPath = path.join(claudeDir, 'mcp.json');
  logInfo(`Config path: ${mcpConfigPath}`);

  // Read or create mcp.json
  let config = { mcpServers: {} };
  if (fs.existsSync(mcpConfigPath)) {
    try {
      config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
      logInfo('Existing mcp.json found');

      // Backup existing config
      const backupPath = `${mcpConfigPath}.backup-${Date.now()}`;
      fs.copyFileSync(mcpConfigPath, backupPath);
      logSuccess(`Backup created: ${backupPath}`);
    } catch (error) {
      logWarning('Could not parse existing mcp.json, creating new one');
    }
  }

  // Ensure mcpServers exists
  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  // Check if memory server already exists
  const serverKey = 'self-improving-memory';
  if (config.mcpServers[serverKey]) {
    logInfo(`Server "${serverKey}" already configured`);
    const answer = await askQuestion(`Update existing "${serverKey}" configuration? (y/n): `);
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      logInfo('Skipping memory server configuration');
      return true; // Still return true as .claude exists
    }
  }

  // Try to find the package (globally or locally)
  let packagePath;
  try {
    const globalNodeModules = execSync('npm root -g', { encoding: 'utf-8' }).trim();
    packagePath = path.join(globalNodeModules, '@pytt0n', 'self-improving-memory-mcp');

    // If not found globally, try without scope
    if (!fs.existsSync(packagePath)) {
      packagePath = path.join(globalNodeModules, 'self-improving-memory-mcp');
    }
  } catch (error) {
    logWarning('Could not find global npm modules, using relative path');
    packagePath = path.join(__dirname, '..');
  }

  const storagePath = path.join(projectPath, '.claude', 'memory-storage');

  // Create memory-storage directory if it doesn't exist
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
    logSuccess('Created memory-storage directory');
  }

  // Add/update memory server with unique key
  config.mcpServers[serverKey] = {
    command: 'node',
    args: [path.join(packagePath, 'index.js')],
    env: {
      MEMORY_STORAGE_PATH: storagePath
    }
  };

  // Count other servers (excluding our own)
  const otherServers = Object.keys(config.mcpServers).filter(k => k !== serverKey);
  if (otherServers.length > 0) {
    logInfo(`Preserving ${otherServers.length} existing MCP server(s): ${otherServers.join(', ')}`);
  }

  // Write updated config
  fs.writeFileSync(mcpConfigPath, JSON.stringify(config, null, 2));
  logSuccess('Updated Claude Code mcp.json (existing configs preserved)');
  return true;
}


// Create .gitignore entries
function updateGitignore(projectPath, customMode) {
  const gitignorePath = path.join(projectPath, '.gitignore');
  const entries = [
    '',
    '# Self-Improving Memory MCP',
    '.claude-memory/',
    '.claude/memory-storage/',
    'memory_data/',
    'cache/',
  ];

  // Add .claude-mcp/ only in custom mode
  if (customMode) {
    entries.push('.claude-mcp/');
  }

  const entryText = entries.join('\n');

  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    if (!content.includes('.claude-memory/')) {
      fs.appendFileSync(gitignorePath, entryText);
      logSuccess('Updated .gitignore');
    } else {
      logInfo('.gitignore already configured');
    }
  } else {
    fs.writeFileSync(gitignorePath, entryText);
    logSuccess('Created .gitignore');
  }
}

// Main installation flow
async function install() {
  // Check for --custom flag
  const customMode = process.argv.includes('--custom');

  log('\n🧠 Self-Improving Memory MCP - Installation\n', 'bright');
  log('='.repeat(50), 'cyan');
  log('');

  if (customMode) {
    log('📦 Custom Mode: Files will be copied for customization', 'yellow');
  } else {
    log('🚀 Clean Mode: Using plugin from node_modules (no file copy)', 'cyan');
    log('   Tip: Use --custom flag to copy files for customization', 'blue');
  }
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

  // Step 4: Create .claude-mcp directory (only in custom mode)
  if (customMode) {
    log('Step 3: Setting up .claude-mcp directory...', 'yellow');
    createClaudeDirectory(projectPath);
    log('');

    // Step 5: Copy agent files
    log('Step 4: Installing agent files...', 'yellow');
    copyAgentFiles(projectPath);
    copyCLAUDEmd(projectPath);
    log('');
  } else {
    log('Step 3: Skipping file copy (clean mode)...', 'yellow');
    logSuccess('Plugin will be used directly from node_modules');
    log('');
  }

  // Step 6: Update .gitignore
  log(`Step ${customMode ? '5' : '4'}: Configuring .gitignore...`, 'yellow');
  updateGitignore(projectPath, customMode);
  log('');

  // Step 7: Configure Claude Code
  log(`Step ${customMode ? '6' : '5'}: Configuring Claude Code...`, 'yellow');
  const claudeCodeConfigured = await updateClaudeCodeConfig(projectPath);

  if (!claudeCodeConfigured) {
    logError('This plugin requires a Claude Code project (.claude directory)');
    logInfo('Please run this command from a Claude Code project directory');
    process.exit(1);
  }
  log('');

  // Step 8: Copy command files (always, regardless of mode)
  log(`Step ${customMode ? '7' : '6'}: Installing slash commands...`, 'yellow');
  copyCommandFiles(projectPath);
  log('');

  // Step 9: Copy statusline scripts, hooks, and configure settings
  log(`Step ${customMode ? '8' : '7'}: Setting up context protection...`, 'yellow');
  copyStatuslineScripts(projectPath);
  copyHooks(projectPath);
  await configureSettings(projectPath);
  log('');

  // Success message
  log('='.repeat(50), 'cyan');
  log('\n✅ Installation Complete!\n', 'green');

  if (customMode) {
    log('📦 Custom Mode Installed:', 'bright');
    log('  • Files copied to .claude-mcp/ directory', 'cyan');
    log('  • You can edit agents and configuration', 'cyan');
    log('  • Changes will be used by this project only', 'cyan');
  } else {
    log('🚀 Clean Mode Installed:', 'bright');
    log('  • Using plugin directly from node_modules', 'cyan');
    log('  • Zero files added to your project', 'cyan');
    log('  • Updates via: npm update -g @pytt0n/self-improving-memory-mcp', 'cyan');
    log('  • To customize: run "memory-install --custom"', 'blue');
  }

  log('');
  log('✨ Features Installed:', 'bright');
  log('  • 🧠 Memory System       ← Automatic knowledge capture', 'cyan');
  log('  • 📊 Context Monitor     ← Real-time token usage in status bar', 'cyan');
  log('  • 🛡️  Auto-Checkpoint     ← Triggers at 80% context (160k tokens)', 'cyan');
  log('  • 💾 Anti-Compaction     ← Never lose context', 'cyan');
  log('  • 🔍 Slash Commands      ← /mh, /checkpoint, etc.', 'cyan');
  log('');
  log('🛡️  Automatic Context Protection:', 'bright');
  log('  When context reaches 80% (160k tokens):', 'yellow');
  log('  1. Hook automatically injects checkpoint instruction', 'cyan');
  log('  2. Claude launches Pre-Compact Interceptor Agent', 'cyan');
  log('  3. Complete session state saved to memory', 'cyan');
  log('  4. Continue in fresh conversation with zero loss', 'cyan');
  log('  ✅ Fully automatic - no manual monitoring needed!', 'green');
  log('');
  log('Next steps:', 'bright');
  log('  1. Reload Claude Code window or restart', 'cyan');
  log('  2. Check status bar for context monitor: ✓ Context: X/200k (X%)', 'cyan');
  log('  3. Verify memory tools: "Claude, can you see the memory tools?"', 'cyan');
  log('  4. Work normally - checkpoint triggers automatically!', 'cyan');
  log('');
  log('Your project structure:', 'bright');
  log('  • .claude/settings.json     ← Status line + hooks configured', 'blue');
  log('  • .claude/hooks/            ← Context guard (auto-checkpoint)', 'blue');
  log('  • .claude/lib/              ← Context monitor scripts', 'blue');
  log('  • .claude/commands/         ← Slash commands', 'blue');
  log('  • .claude-memory/           ← Vector database (auto-created)', 'blue');
  if (customMode) {
    log('  • .claude-mcp/              ← Plugin configuration (customizable)', 'blue');
  }
  log('  • .gitignore                ← Updated to ignore memory data', 'blue');
  log('');
  log('Configuration Options:', 'bright');
  log('  Status Line (switch versions):', 'cyan');
  log('    Edit .claude/settings.json:', 'dim');
  log('    "command": ".claude/lib/statusline-context-advanced.sh"', 'dim');
  log('  Auto-Checkpoint (adjust threshold):', 'cyan');
  log('    Edit .claude/hooks/context-guard.sh', 'dim');
  log('    Change TRIGGER_THRESHOLD (default: 160000 = 80%)', 'dim');
  log('  Disable features:', 'cyan');
  log('    Remove statusLine or hooks from settings.json', 'dim');
  log('');
  log('Documentation:', 'bright');
  log('  • Context Monitor: docs/CONTEXT_MONITOR.md', 'blue');
  log('  • README: https://github.com/SuperPiTT/self-improving-memory-mcp', 'blue');
  log('  • NPM: https://www.npmjs.com/package/@pytt0n/self-improving-memory-mcp', 'blue');
  log('');
  log('🎉 Happy coding with infinite memory and context visibility!', 'green');
  log('');

  // Run verification
  log('='.repeat(50), 'cyan');
  log('\n🔍 Running post-installation verification...\n', 'yellow');

  const verifyScript = path.join(__dirname, 'verify-installation.js');
  const result = spawnSync('node', [verifyScript], {
    stdio: 'inherit',
    cwd: projectPath
  });

  if (result.status !== 0) {
    log('');
    logError('Verification detected some issues. Please review the output above.');
    process.exit(1);
  }
}

// Run installer
install().catch((error) => {
  logError('Installation failed:');
  console.error(error);
  process.exit(1);
});
