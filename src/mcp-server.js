/**
 * MCP Server Setup
 * Configures and exports the MCP server with all tool handlers
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { sanitize } from './schemas/validation.js';

/**
 * Create and configure MCP server with knowledge store
 * @param {KnowledgeStore} store - The knowledge store instance
 * @returns {Server} Configured MCP server
 */
export function createMCPServer(store) {
  const server = new Server(
    {
      name: 'self-improving-memory',
      version: '2.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Tool definitions
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'save_knowledge',
          description: 'Save a piece of knowledge (decision, error, solution, pattern, insight) with confidence score',
          inputSchema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['decision', 'error', 'solution', 'pattern', 'insight'],
                description: 'Type of knowledge',
              },
              content: {
                type: 'string',
                description: 'The knowledge content',
              },
              context: {
                type: 'string',
                description: 'Optional context or reasoning',
              },
              confidence: {
                type: 'number',
                minimum: 0,
                maximum: 1,
                description: 'Confidence level (0-1)',
              },
              verified: {
                type: 'boolean',
                description: 'Has this been verified?',
                default: false,
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Searchable tags',
              },
            },
            required: ['type', 'content', 'confidence', 'tags'],
          },
        },
        {
          name: 'search_knowledge',
          description: 'Search knowledge base using semantic vector search',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query',
              },
              type: {
                type: 'string',
                enum: ['decision', 'error', 'solution', 'pattern', 'insight'],
                description: 'Filter by type (optional)',
              },
              minConfidence: {
                type: 'number',
                minimum: 0,
                maximum: 1,
                description: 'Minimum confidence threshold (optional)',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'link_knowledge',
          description: 'Link related knowledge entries',
          inputSchema: {
            type: 'object',
            properties: {
              sourceId: { type: 'string' },
              targetId: { type: 'string' },
              relationship: {
                type: 'string',
                default: 'relates_to',
              },
            },
            required: ['sourceId', 'targetId'],
          },
        },
        {
          name: 'get_stats',
          description: 'Get statistics about the knowledge base',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'export_markdown',
          description: 'Export knowledge base to markdown',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'export_graph',
          description: 'Export knowledge graph visualization',
          inputSchema: {
            type: 'object',
            properties: {
              format: {
                type: 'string',
                enum: ['html', 'json', 'dot', 'd3', 'cytoscape'],
                description: 'Export format (default: html)',
                default: 'html'
              },
            },
          },
        },
        {
          name: 'detect_contradictions',
          description: 'Detect semantic contradictions in knowledge base',
          inputSchema: {
            type: 'object',
            properties: {
              similarityThreshold: {
                type: 'number',
                minimum: 0,
                maximum: 1,
                description: 'Similarity threshold for contradiction detection (default: 0.85)',
                default: 0.85
              },
              minConfidenceDelta: {
                type: 'number',
                minimum: 0,
                maximum: 1,
                description: 'Minimum confidence difference to flag (default: 0.1)',
                default: 0.1
              },
              sameTypeOnly: {
                type: 'boolean',
                description: 'Only check within same type (default: false)',
                default: false
              }
            },
          },
        },
        {
          name: 'auto_resolve_contradictions',
          description: 'Automatically resolve all detected contradictions based on confidence',
          inputSchema: {
            type: 'object',
            properties: {
              similarityThreshold: {
                type: 'number',
                minimum: 0,
                maximum: 1,
                description: 'Similarity threshold (default: 0.85)',
                default: 0.85
              },
            },
          },
        },
        {
          name: 'get_superseded_history',
          description: 'Get history of superseded knowledge entries',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'analyze_patterns',
          description: 'Analyze frequency patterns in knowledge base',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'generate_insights',
          description: 'Generate insights and recommendations from knowledge base',
          inputSchema: {
            type: 'object',
            properties: {
              similarityThreshold: {
                type: 'number',
                minimum: 0,
                maximum: 1,
                description: 'Clustering similarity threshold (default: 0.75)',
                default: 0.75
              },
              minClusterSize: {
                type: 'number',
                minimum: 1,
                description: 'Minimum cluster size (default: 2)',
                default: 2
              }
            },
          },
        },
        {
          name: 'detect_antipatterns',
          description: 'Detect anti-patterns in knowledge base',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'suggest_tags',
          description: 'Get tag suggestions based on content clustering',
          inputSchema: {
            type: 'object',
            properties: {
              similarityThreshold: {
                type: 'number',
                minimum: 0,
                maximum: 1,
                description: 'Clustering similarity threshold (default: 0.75)',
                default: 0.75
              }
            },
          },
        },
        {
          name: 'cluster_knowledge',
          description: 'Cluster knowledge entries by semantic similarity',
          inputSchema: {
            type: 'object',
            properties: {
              similarityThreshold: {
                type: 'number',
                minimum: 0,
                maximum: 1,
                description: 'Similarity threshold (default: 0.75)',
                default: 0.75
              },
              minClusterSize: {
                type: 'number',
                minimum: 1,
                description: 'Minimum cluster size (default: 2)',
                default: 2
              },
              maxClusters: {
                type: 'number',
                minimum: 1,
                description: 'Maximum clusters to return (default: 10)',
                default: 10
              }
            },
          },
        },
        {
          name: 'get_cache_stats',
          description: 'Get embedding cache statistics',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'clear_cache',
          description: 'Clear embedding cache',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'persist_cache',
          description: 'Persist embedding cache to disk',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    };
  });

  // Tool handlers
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'save_knowledge': {
          // Input validation and sanitization
          const sanitizedContent = sanitize.string(args.content);
          const sanitizedContext = args.context ? sanitize.string(args.context) : undefined;
          const sanitizedTags = sanitize.stringArray(args.tags || []);

          // Validate confidence range
          const confidence = Number(args.confidence);
          if (isNaN(confidence) || confidence < 0 || confidence > 1) {
            throw new Error('Confidence must be a number between 0 and 1');
          }

          // Validate required fields
          if (!sanitizedContent || sanitizedContent.length === 0) {
            throw new Error('Content cannot be empty');
          }

          if (!args.type || !['decision', 'error', 'solution', 'pattern', 'insight'].includes(args.type)) {
            throw new Error('Invalid type. Must be one of: decision, error, solution, pattern, insight');
          }

          const id = await store.addEntry({
            type: args.type,
            content: sanitizedContent,
            context: sanitizedContext,
            confidence,
            verified: args.verified || false,
            tags: sanitizedTags,
          });

          return {
            content: [
              {
                type: 'text',
                text: `Knowledge saved with ID: ${id}`,
              },
            ],
          };
        }

        case 'search_knowledge': {
          // Input validation and sanitization
          const sanitizedQuery = sanitize.string(args.query);

          if (!sanitizedQuery || sanitizedQuery.length === 0) {
            throw new Error('Search query cannot be empty');
          }

          if (sanitizedQuery.length > 500) {
            throw new Error('Search query too long (max 500 characters)');
          }

          // Validate minConfidence if provided
          if (args.minConfidence !== undefined) {
            const minConf = Number(args.minConfidence);
            if (isNaN(minConf) || minConf < 0 || minConf > 1) {
              throw new Error('minConfidence must be a number between 0 and 1');
            }
          }

          const results = await store.search(sanitizedQuery, {
            type: args.type,
            minConfidence: args.minConfidence,
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(results, null, 2),
              },
            ],
          };
        }

        case 'link_knowledge': {
          await store.linkEntries(
            args.sourceId,
            args.targetId,
            args.relationship
          );

          return {
            content: [
              {
                type: 'text',
                text: `Linked ${args.sourceId} -> ${args.targetId}`,
              },
            ],
          };
        }

        case 'get_stats': {
          const stats = await store.getStats();

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(stats, null, 2),
              },
            ],
          };
        }

        case 'export_markdown': {
          const exportPath = await store.exportMarkdown();

          return {
            content: [
              {
                type: 'text',
                text: `Exported to: ${exportPath}`,
              },
            ],
          };
        }

        case 'export_graph': {
          const format = args.format || 'html';

          if (format === 'html') {
            const htmlPath = await store.exportGraphVisualization();
            return {
              content: [
                {
                  type: 'text',
                  text: `Graph visualization exported to: ${htmlPath}\nOpen this file in your browser to view the interactive graph.`,
                },
              ],
            };
          } else {
            const graphData = await store.exportGraph(format);
            return {
              content: [
                {
                  type: 'text',
                  text: graphData,
                },
              ],
            };
          }
        }

        case 'detect_contradictions': {
          const options = {
            similarityThreshold: args.similarityThreshold || 0.85,
            minConfidenceDelta: args.minConfidenceDelta || 0.1,
            sameTypeOnly: args.sameTypeOnly || false
          };

          const contradictions = await store.detectContradictions(options);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  detected: contradictions.length,
                  contradictions
                }, null, 2),
              },
            ],
          };
        }

        case 'auto_resolve_contradictions': {
          const options = {
            similarityThreshold: args.similarityThreshold || 0.85
          };

          const result = await store.autoResolveContradictions(options);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'get_superseded_history': {
          const history = await store.getSupersededHistory();

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  superseded: history.length,
                  entries: history
                }, null, 2),
              },
            ],
          };
        }

        case 'analyze_patterns': {
          const analysis = await store.analyzePatterns();

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(analysis, null, 2),
              },
            ],
          };
        }

        case 'generate_insights': {
          const options = {
            similarityThreshold: args.similarityThreshold || 0.75,
            minClusterSize: args.minClusterSize || 2
          };

          const result = await store.generateInsights(options);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'detect_antipatterns': {
          const antiPatterns = await store.detectAntiPatterns();

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  found: antiPatterns.length,
                  antiPatterns
                }, null, 2),
              },
            ],
          };
        }

        case 'suggest_tags': {
          const options = {
            similarityThreshold: args.similarityThreshold || 0.75
          };

          const suggestions = await store.suggestTags(options);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  suggestions: suggestions.length,
                  tags: suggestions
                }, null, 2),
              },
            ],
          };
        }

        case 'cluster_knowledge': {
          const options = {
            similarityThreshold: args.similarityThreshold || 0.75,
            minClusterSize: args.minClusterSize || 2,
            maxClusters: args.maxClusters || 10
          };

          const clusters = await store.clusterKnowledge(options);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  clustersFound: clusters.length,
                  clusters: clusters.map(c => ({
                    size: c.size,
                    avgConfidence: c.avgConfidence,
                    types: c.types,
                    tags: c.tags,
                    centroid: {
                      id: c.centroid.id,
                      content: c.centroid.content.substring(0, 100) + '...'
                    }
                  }))
                }, null, 2),
              },
            ],
          };
        }

        case 'get_cache_stats': {
          const stats = store.vectorStore.getCacheStats();

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(stats, null, 2),
              },
            ],
          };
        }

        case 'clear_cache': {
          store.vectorStore.clearCache();

          return {
            content: [
              {
                type: 'text',
                text: 'Cache cleared successfully',
              },
            ],
          };
        }

        case 'persist_cache': {
          await store.vectorStore.persistCache();

          return {
            content: [
              {
                type: 'text',
                text: 'Cache persisted to disk successfully',
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}
