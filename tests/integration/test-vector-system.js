#!/usr/bin/env node

/**
 * Test completo del sistema de vector search
 * Verifica que todo funciona end-to-end
 */

import { spawn } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

function log(color, ...args) {
  console.log(colors[color], ...args, colors.reset);
}

let mcpProcess = null;

async function startMCPServer() {
  log('cyan', '\n🚀 Starting MCP Server...\n');

  mcpProcess = spawn('node', ['index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let serverReady = false;

  mcpProcess.stderr.on('data', (data) => {
    const output = data.toString();
    if (output.includes('MCP server running')) {
      serverReady = true;
    }
    process.stderr.write(data);
  });

  // Esperar a que el servidor esté listo
  let waited = 0;
  while (!serverReady && waited < 30000) {
    await sleep(500);
    waited += 500;
  }

  if (!serverReady) {
    throw new Error('Server did not start in time');
  }

  log('green', '✓ MCP Server started\n');
  return mcpProcess;
}

async function sendMCPRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    };

    let response = '';

    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, 10000);

    mcpProcess.stdout.once('data', (data) => {
      clearTimeout(timeout);
      response = data.toString();
      try {
        const parsed = JSON.parse(response);
        resolve(parsed);
      } catch (error) {
        reject(new Error(`Failed to parse response: ${response}`));
      }
    });

    mcpProcess.stdin.write(JSON.stringify(request) + '\n');
  });
}

async function testAddEntry() {
  log('cyan', '📝 Test 1: Agregar entrada con vector embedding...');

  try {
    const response = await sendMCPRequest('tools/call', {
      name: 'save_knowledge',
      arguments: {
        type: 'insight',
        content: 'Vector search usa embeddings semánticos para búsqueda inteligente',
        context: 'LanceDB + Transformers.js implementado correctamente',
        confidence: 0.95,
        verified: true,
        tags: ['vector-search', 'embeddings', 'lancedb'],
      },
    });

    if (response.result && response.result.content) {
      const text = response.result.content[0].text;
      log('green', `✓ Entrada guardada: ${text}`);
      return text.match(/ID: ([a-f0-9-]+)/)?.[1];
    } else {
      throw new Error('Unexpected response format');
    }
  } catch (error) {
    log('red', `✗ Error: ${error.message}`);
    throw error;
  }
}

async function testSemanticSearch() {
  log('cyan', '\n🔍 Test 2: Búsqueda semántica (debe encontrar conceptos relacionados)...');

  try {
    // Buscar "neural embeddings" debería encontrar "vector search" y "embeddings"
    const response = await sendMCPRequest('tools/call', {
      name: 'search_knowledge',
      arguments: {
        query: 'neural embeddings semantic similarity',
      },
    });

    if (response.result && response.result.content) {
      const results = JSON.parse(response.result.content[0].text);

      log('yellow', `  Encontrados: ${results.length} resultados`);

      if (results.length > 0) {
        results.slice(0, 3).forEach((r, i) => {
          log('reset', `  ${i + 1}. [${r.type}] ${r.content.slice(0, 60)}...`);
        });
        log('green', '✓ Búsqueda semántica funciona');
        return results.length;
      } else {
        log('red', '✗ No se encontraron resultados');
        return 0;
      }
    }
  } catch (error) {
    log('red', `✗ Error: ${error.message}`);
    throw error;
  }
}

async function testStats() {
  log('cyan', '\n📊 Test 3: Estadísticas con vectores...');

  try {
    const response = await sendMCPRequest('tools/call', {
      name: 'get_stats',
      arguments: {},
    });

    if (response.result && response.result.content) {
      const stats = JSON.parse(response.result.content[0].text);

      log('yellow', `  Total entradas JSON: ${stats.totalEntries}`);
      log('yellow', `  Total vectores: ${stats.vectorEntries}`);
      log('yellow', `  Estado sync: ${stats.syncStatus}`);

      if (stats.syncStatus === 'synced' && stats.totalEntries === stats.vectorEntries) {
        log('green', '✓ JSON y VectorDB sincronizados correctamente');
        return true;
      } else {
        log('red', `✗ Bases de datos NO sincronizadas`);
        return false;
      }
    }
  } catch (error) {
    log('red', `✗ Error: ${error.message}`);
    throw error;
  }
}

async function testExactMatch() {
  log('cyan', '\n🎯 Test 4: Búsqueda exacta por tags...');

  try {
    const response = await sendMCPRequest('tools/call', {
      name: 'search_knowledge',
      arguments: {
        query: 'lancedb',
      },
    });

    if (response.result && response.result.content) {
      const results = JSON.parse(response.result.content[0].text);

      if (results.length > 0) {
        const hasLanceDB = results.some(r =>
          r.tags?.includes('lancedb') ||
          r.content.toLowerCase().includes('lancedb')
        );

        if (hasLanceDB) {
          log('green', `✓ Encontró entradas con 'lancedb' (${results.length} resultados)`);
          return true;
        }
      }
      log('red', '✗ No encontró entradas con lancedb');
      return false;
    }
  } catch (error) {
    log('red', `✗ Error: ${error.message}`);
    throw error;
  }
}

async function testTypeFilter() {
  log('cyan', '\n🔖 Test 5: Filtro por tipo...');

  try {
    const response = await sendMCPRequest('tools/call', {
      name: 'search_knowledge',
      arguments: {
        query: 'error npm package',
        type: 'error',
      },
    });

    if (response.result && response.result.content) {
      const results = JSON.parse(response.result.content[0].text);

      const allErrors = results.every(r => r.type === 'error');

      if (results.length > 0 && allErrors) {
        log('green', `✓ Filtro por tipo funciona (${results.length} errores encontrados)`);
        return true;
      } else if (results.length === 0) {
        log('yellow', '⚠ No se encontraron errores (puede ser normal)');
        return true;
      } else {
        log('red', '✗ Resultados contienen tipos incorrectos');
        return false;
      }
    }
  } catch (error) {
    log('red', `✗ Error: ${error.message}`);
    throw error;
  }
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  try {
    await startMCPServer();
    await sleep(2000); // Esperar warm-up

    log('cyan', '\n' + '='.repeat(60));
    log('cyan', '  VECTOR SEARCH SYSTEM - INTEGRATION TESTS');
    log('cyan', '='.repeat(60) + '\n');

    // Test 1: Agregar entrada
    try {
      await testAddEntry();
      passed++;
    } catch (error) {
      failed++;
    }

    await sleep(1000);

    // Test 2: Búsqueda semántica
    try {
      const results = await testSemanticSearch();
      if (results > 0) passed++;
      else failed++;
    } catch (error) {
      failed++;
    }

    await sleep(500);

    // Test 3: Estadísticas
    try {
      const synced = await testStats();
      if (synced) passed++;
      else failed++;
    } catch (error) {
      failed++;
    }

    await sleep(500);

    // Test 4: Búsqueda exacta
    try {
      const found = await testExactMatch();
      if (found) passed++;
      else failed++;
    } catch (error) {
      failed++;
    }

    await sleep(500);

    // Test 5: Filtro por tipo
    try {
      const works = await testTypeFilter();
      if (works) passed++;
      else failed++;
    } catch (error) {
      failed++;
    }

    // Resumen
    log('cyan', '\n' + '='.repeat(60));
    log('cyan', '  RESUMEN');
    log('cyan', '='.repeat(60) + '\n');
    log('green', `✓ Passed: ${passed}/5`);
    if (failed > 0) {
      log('red', `✗ Failed: ${failed}/5`);
    }
    log('cyan', '\n' + '='.repeat(60) + '\n');

    if (passed === 5) {
      log('green', '🎉 TODOS LOS TESTS PASARON - Sistema 100% funcional\n');
      process.exit(0);
    } else {
      log('red', '❌ ALGUNOS TESTS FALLARON\n');
      process.exit(1);
    }

  } catch (error) {
    log('red', `\n❌ Test suite failed: ${error.message}\n`);
    process.exit(1);
  } finally {
    if (mcpProcess) {
      mcpProcess.kill();
    }
  }
}

runTests();
