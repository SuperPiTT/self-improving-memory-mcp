#!/usr/bin/env node

/**
 * CLI para gestionar la base de conocimiento (100% VectorDB)
 * Sin JSON - todo almacenado en LanceDB
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve paths relative to this file (works both locally and globally installed)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import VectorStore from correct location
const { VectorStore } = await import(path.join(__dirname, 'src', 'vector-store.js'));

const MEMORY_DIR = '.claude-memory';

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(colors[color], ...args, colors.reset);
}

async function getVectorStore(projectPath = process.cwd()) {
  const memoryPath = path.join(projectPath, MEMORY_DIR);
  const store = new VectorStore(memoryPath);
  await store.initialize();
  return store;
}

// ============================================================================
// COMANDOS
// ============================================================================

async function cmdInit(projectPath = process.cwd()) {
  const memoryDir = path.join(projectPath, MEMORY_DIR);

  try {
    await fs.mkdir(memoryDir, { recursive: true });

    // Inicializar VectorStore (crea estructura de directorios)
    await getVectorStore(projectPath);

    log('green', '✓ Vector memory system initialized in:', memoryDir);
    log('dim', '  Run "memory-cli stats" to see status');
  } catch (error) {
    log('red', '✗ Error initializing:', error.message);
  }
}

async function cmdStats(projectPath = process.cwd()) {
  try {
    const store = await getVectorStore(projectPath);
    const entries = await store.getAllEntries();

    if (entries.length === 0) {
      log('yellow', '\n⚠️  No entries found. Use MCP tools to add knowledge.\n');
      return;
    }

    const byType = {};
    let totalConfidence = 0;
    let verifiedCount = 0;

    entries.forEach(entry => {
      byType[entry.type] = (byType[entry.type] || 0) + 1;
      totalConfidence += entry.confidence || 0;
      if (entry.verified) verifiedCount++;
    });

    log('cyan', '\n📊 Knowledge Base Statistics\n');
    log('bright', 'Total Entries:', entries.length);
    log('dim', '─────────────────────────────');

    Object.entries(byType).forEach(([type, count]) => {
      const icon = {
        decision: '🎯',
        error: '🐛',
        solution: '✅',
        pattern: '🔄',
        insight: '💡',
      }[type] || '📝';

      log('bright', `${icon} ${type}:`, count);
    });

    log('dim', '─────────────────────────────');
    log('green', 'Avg Confidence:', ((totalConfidence / entries.length) * 100).toFixed(1) + '%');
    log('green', 'Verified:', ((verifiedCount / entries.length) * 100).toFixed(1) + '%');

    const timestamps = entries.map(e => e.timestamp).filter(Boolean);
    if (timestamps.length > 0) {
      const oldest = Math.min(...timestamps);
      const newest = Math.max(...timestamps);
      log('dim', '\nOldest Entry:', new Date(oldest).toLocaleString());
      log('dim', 'Newest Entry:', new Date(newest).toLocaleString());
    }

    console.log();
  } catch (error) {
    log('red', '✗ Error:', error.message);
  }
}

async function cmdList(type = null, projectPath = process.cwd()) {
  try {
    const store = await getVectorStore(projectPath);
    const allEntries = await store.getAllEntries();

    const entries = allEntries
      .filter(e => !type || e.type === type)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (entries.length === 0) {
      log('yellow', 'No entries found');
      return;
    }

    log('cyan', `\n📚 Knowledge Entries${type ? ` (${type})` : ''}\n`);

    entries.forEach(entry => {
      const icon = {
        decision: '🎯',
        error: '🐛',
        solution: '✅',
        pattern: '🔄',
        insight: '💡',
      }[entry.type] || '📝';

      const confidence = ((entry.confidence || 0) * 100).toFixed(0);
      const confColor = confidence >= 80 ? 'green' : confidence >= 60 ? 'yellow' : 'red';

      log('bright', `\n${icon} [${entry.id.slice(0, 8)}] ${entry.content.slice(0, 60)}...`);
      log(confColor, `   Confidence: ${confidence}% ${entry.verified ? '✓ Verified' : ''}`);
      log('dim', `   Tags: ${(entry.tags || []).join(', ')}`);
      log('dim', `   Accessed: ${entry.accessCount || 0} times`);
      if (entry.timestamp) {
        log('dim', `   ${new Date(entry.timestamp).toLocaleDateString()}`);
      }
    });

    console.log();
  } catch (error) {
    log('red', '✗ Error:', error.message);
  }
}

async function cmdSearch(query, projectPath = process.cwd()) {
  try {
    const store = await getVectorStore(projectPath);

    log('cyan', `\n🔍 Semantic Search: "${query}"\n`);
    log('dim', 'Searching with vector embeddings...\n');

    const results = await store.search(query, 10);

    if (results.length === 0) {
      log('yellow', `No results found for: "${query}"`);
      return;
    }

    log('dim', `Found ${results.length} entries\n`);

    results.forEach((entry, idx) => {
      const icon = {
        decision: '🎯',
        error: '🐛',
        solution: '✅',
        pattern: '🔄',
        insight: '💡',
      }[entry.type] || '📝';

      log('bright', `${idx + 1}. ${icon} [${entry.id.slice(0, 8)}] ${entry.type.toUpperCase()}`);
      log('reset', entry.content);
      if (entry.context) {
        log('dim', `Context: ${entry.context}`);
      }
      log('green', `Confidence: ${((entry.confidence || 0) * 100).toFixed(0)}%`);
      console.log();
    });
  } catch (error) {
    log('red', '✗ Error:', error.message);
  }
}

async function cmdShow(id, projectPath = process.cwd()) {
  try {
    const store = await getVectorStore(projectPath);

    // Buscar por ID completo o parcial
    const allEntries = await store.getAllEntries();
    const entry = allEntries.find(e =>
      e.id === id || e.id.startsWith(id)
    );

    if (!entry) {
      log('red', `✗ Entry not found: ${id}`);
      return;
    }

    const icon = {
      decision: '🎯',
      error: '🐛',
      solution: '✅',
      pattern: '🔄',
      insight: '💡',
    }[entry.type] || '📝';

    log('cyan', `\n${icon} ${entry.type.toUpperCase()}\n`);
    log('dim', `ID: ${entry.id}`);
    log('dim', '─────────────────────────────\n');
    log('bright', entry.content);
    console.log();

    if (entry.context) {
      log('yellow', 'Context:');
      log('reset', entry.context);
      console.log();
    }

    log('green', `Confidence: ${((entry.confidence || 0) * 100).toFixed(0)}%`);
    log('reset', `Verified: ${entry.verified ? '✓ Yes' : '✗ No'}`);
    log('reset', `Tags: ${(entry.tags || []).join(', ')}`);
    log('dim', `\nAccessed: ${entry.accessCount || 0} times`);
    if (entry.timestamp) {
      log('dim', `Created: ${new Date(entry.timestamp).toLocaleString()}`);
    }
    if (entry.lastAccessed) {
      log('dim', `Last accessed: ${new Date(entry.lastAccessed).toLocaleString()}`);
    }

    if (entry.relatedIds && entry.relatedIds.length > 0) {
      log('yellow', `\nRelated entries: ${entry.relatedIds.length}`);
      entry.relatedIds.forEach(relId => {
        const related = allEntries.find(e => e.id === relId);
        if (related) {
          log('dim', `  → [${relId.slice(0, 8)}] ${related.type}: ${related.content.slice(0, 50)}...`);
        }
      });
    }

    console.log();
  } catch (error) {
    log('red', '✗ Error:', error.message);
  }
}

async function cmdExport(format = 'md', projectPath = process.cwd()) {
  try {
    const store = await getVectorStore(projectPath);
    const entries = await store.getAllEntries();

    if (entries.length === 0) {
      log('yellow', '⚠️  No entries to export');
      return;
    }

    const memoryPath = path.join(projectPath, MEMORY_DIR);

    if (format === 'md') {
      let md = '# Project Knowledge Base\n\n';
      md += `Generated: ${new Date().toISOString()}\n\n`;
      md += `Total Entries: ${entries.length}\n\n`;

      const byType = {};
      entries.forEach(e => {
        if (!byType[e.type]) byType[e.type] = [];
        byType[e.type].push(e);
      });

      for (const [type, typeEntries] of Object.entries(byType)) {
        md += `## ${type.toUpperCase()}\n\n`;

        typeEntries.sort((a, b) => (b.confidence || 0) - (a.confidence || 0)).forEach(entry => {
          md += `### ${entry.content.split('\n')[0]}\n\n`;
          md += `**Confidence:** ${((entry.confidence || 0) * 100).toFixed(0)}% `;
          md += `${entry.verified ? '✓ Verified' : ''}\n\n`;
          md += `${entry.content}\n\n`;

          if (entry.context) {
            md += `*Context:* ${entry.context}\n\n`;
          }

          if (entry.tags && entry.tags.length > 0) {
            md += `*Tags:* ${entry.tags.join(', ')}\n\n`;
          }

          md += `*ID:* \`${entry.id}\`  \n`;
          md += `*Accessed:* ${entry.accessCount || 0} times\n\n`;
          md += '---\n\n';
        });
      }

      const exportPath = path.join(memoryPath, 'knowledge-export.md');
      await fs.writeFile(exportPath, md);

      log('green', '✓ Exported to:', exportPath);
    } else {
      log('red', '✗ Unknown format. Use: md');
    }
  } catch (error) {
    log('red', '✗ Error:', error.message);
  }
}

async function cmdAnalyze(projectPath = process.cwd()) {
  try {
    const store = await getVectorStore(projectPath);
    const entries = await store.getAllEntries();

    if (entries.length === 0) {
      log('yellow', '\n⚠️  No entries to analyze\n');
      return;
    }

    log('cyan', '\n🔍 Knowledge Analysis\n');

    // Baja confianza
    const lowConfidence = entries.filter(e => (e.confidence || 0) < 0.7);
    if (lowConfidence.length > 0) {
      log('yellow', '⚠️  Low Confidence Entries:', lowConfidence.length);
      lowConfidence.forEach(e => {
        log('dim', `   [${e.id.slice(0, 8)}] ${e.type}: ${e.content.slice(0, 50)}... (${((e.confidence || 0) * 100).toFixed(0)}%)`);
      });
      console.log();
    }

    // No verificados
    const unverified = entries.filter(e => !e.verified);
    if (unverified.length > 0) {
      log('yellow', '🔬 Unverified Entries:', unverified.length);
      log('dim', '   Consider verifying these in production\n');
    }

    // Poco accedidos
    const unused = entries.filter(e => (e.accessCount || 0) === 0);
    if (unused.length > 0) {
      log('blue', '💤 Never Accessed:', unused.length);
      log('dim', '   These entries might be outdated\n');
    }

    // Patrones por tags
    const tagCounts = {};
    entries.forEach(e => {
      (e.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topTags.length > 0) {
      log('magenta', '🏷️  Top Tags:');
      topTags.forEach(([tag, count]) => {
        log('dim', `   ${tag}: ${count}`);
      });
      console.log();
    }

    // Recomendaciones
    log('green', '💡 Recommendations:\n');

    if (lowConfidence.length > 0) {
      log('reset', `   1. Verify ${lowConfidence.length} low-confidence entries`);
    }

    if (unused.length > 5) {
      log('reset', `   2. Review ${unused.length} unused entries - might be outdated`);
    }

    if (entries.filter(e => e.verified).length / entries.length < 0.5) {
      log('reset', '   3. Increase verification rate - test in production');
    }

    console.log();
  } catch (error) {
    log('red', '✗ Error:', error.message);
  }
}

async function cmdValidate(projectPath = process.cwd()) {
  try {
    const store = await getVectorStore(projectPath);
    const count = await store.count();

    log('cyan', '\n🔍 Vector Database Validation\n');
    log('green', `✓ Vector database operational`);
    log('bright', `  Total vectors: ${count}`);
    console.log();
  } catch (error) {
    log('red', '✗ Error:', error.message);
  }
}

async function cmdReset(projectPath = process.cwd()) {
  try {
    const memoryPath = path.join(projectPath, MEMORY_DIR);

    // Check if memory directory exists
    try {
      await fs.access(memoryPath);
    } catch {
      log('yellow', '⚠️  No knowledge base found to reset');
      return;
    }

    // Get stats before reset
    const store = await getVectorStore(projectPath);
    const entries = await store.getAllEntries();
    const count = entries.length;

    if (count === 0) {
      log('yellow', '⚠️  Knowledge base is already empty');
      return;
    }

    log('yellow', `\n⚠️  WARNING: This will delete ALL knowledge base data (${count} entries)\n`);
    log('red', 'This action cannot be undone!\n');

    // Confirmation prompt
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('Type "DELETE" to confirm: ', resolve);
    });
    rl.close();

    if (answer.trim() !== 'DELETE') {
      log('blue', '\n✓ Reset cancelled');
      return;
    }

    // Delete the entire memory directory
    await fs.rm(memoryPath, { recursive: true, force: true });

    log('green', `\n✓ Knowledge base reset complete`);
    log('dim', `  Deleted ${count} entries`);
    log('dim', '  Run "memory-cli init" to reinitialize\n');
  } catch (error) {
    log('red', '✗ Error:', error.message);
  }
}

// ============================================================================
// CLI MAIN
// ============================================================================

const commands = {
  init: cmdInit,
  stats: cmdStats,
  list: cmdList,
  search: cmdSearch,
  show: cmdShow,
  export: cmdExport,
  analyze: cmdAnalyze,
  validate: cmdValidate,
  reset: cmdReset,
};

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    log('cyan', '\n📚 Memory CLI - Manage your vector knowledge base\n');
    log('bright', 'Usage: memory-cli <command> [options]\n');
    log('reset', 'Commands:');
    log('green', '  init                     ', colors.dim, 'Initialize vector memory system');
    log('green', '  stats                    ', colors.dim, 'Show statistics');
    log('green', '  list [type]              ', colors.dim, 'List entries (filter by type)');
    log('green', '  search <query>           ', colors.dim, 'Semantic search with embeddings');
    log('green', '  show <id>                ', colors.dim, 'Show entry details');
    log('green', '  export [md]              ', colors.dim, 'Export knowledge to markdown');
    log('green', '  analyze                  ', colors.dim, 'Analyze knowledge quality');
    log('green', '  validate                 ', colors.dim, 'Validate vector database');
    log('red', '  reset                    ', colors.dim, 'Delete ALL knowledge (requires confirmation)');
    log('reset', '\nExamples:');
    log('dim', '  memory-cli init');
    log('dim', '  memory-cli list decision');
    log('dim', '  memory-cli search "postgresql optimization"');
    log('dim', '  memory-cli export md');
    log('dim', '  memory-cli reset');
    console.log();
    return;
  }

  const handler = commands[command];

  if (!handler) {
    log('red', `✗ Unknown command: ${command}`);
    log('dim', 'Run "memory-cli help" for usage');
    return;
  }

  try {
    await handler(...args.slice(1));
  } catch (error) {
    log('red', '✗ Error:', error.message);
  }
}

main();
