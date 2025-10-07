#!/usr/bin/env node

/**
 * Self-Improving Project Memory MCP Server
 * Entry point for the MCP server
 *
 * Sistema 100% basado en Vector Search (LanceDB + Transformers.js)
 * Sin almacenamiento JSON - VectorDB es la única fuente de verdad
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { KnowledgeStore } from './src/knowledge-store.js';
import { createMCPServer } from './src/mcp-server.js';

async function main() {
  const projectPath = process.cwd();
  const store = new KnowledgeStore(projectPath);

  await store.initialize();

  const server = createMCPServer(store);
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error('Self-Improving Memory MCP server running - 100% Vector Search');
}

main().catch(console.error);
