import { pipeline } from '@xenova/transformers';
import lancedb from '@lancedb/lancedb';
import path from 'path';
import fs from 'fs/promises';
import { retryWithBackoff, CircuitBreaker, RetryPredicates } from './utils/retry.js';
import { PerformanceTimer, performanceMetrics } from './utils/performance.js';
import { LRUCache, BatchProcessor, EmbeddingQuantizer } from './utils/cache.js';

/**
 * VectorStore - Maneja embeddings y búsqueda semántica
 * Incluye mejoras críticas: warm-up, UPDATE, migración robusta, retry logic, circuit breaker
 */
export class VectorStore {
  constructor(memoryPath, options = {}) {
    this.dbPath = path.join(memoryPath, 'vectors', 'lancedb');
    this.embedder = null;
    this.table = null;
    this.isInitialized = false;
    this.isWarmedUp = false;

    // Performance optimizations
    this.embeddingCache = new LRUCache(
      options.cacheSize || 1000,
      path.join(memoryPath, 'cache', 'embeddings.json')
    );
    this.batchProcessor = new BatchProcessor(
      options.batchSize || 10,
      options.batchWaitMs || 100
    );
    this.useQuantization = options.useQuantization !== false; // Default: true

    // Retry and circuit breaker configuration
    this.retryOptions = {
      maxAttempts: options.maxRetries || 3,
      initialDelay: options.initialRetryDelay || 1000,
      maxDelay: options.maxRetryDelay || 5000,
      backoffFactor: 2,
      shouldRetry: RetryPredicates.any(
        RetryPredicates.isNetworkError,
        RetryPredicates.isDatabaseError
      ),
      onRetry: (error, attempt, delay) => {
        console.error(`[Retry ${attempt}] Operation failed: ${error.message}. Retrying in ${delay}ms...`);
      }
    };

    // Circuit breakers for different operations
    this.circuitBreakers = {
      embeddings: new CircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 30000, // 30 seconds
      }),
      database: new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 60000, // 1 minute
      })
    };
  }

  /**
   * Inicializar modelo de embeddings y conexión a LanceDB
   * MEJORA: Progress indicators
   */
  async initialize() {
    if (this.isInitialized) return;

    console.error('[1/3] Initializing VectorStore...');
    console.error('[2/3] Loading embedding model (~90MB)...');

    // Inicializar modelo de embeddings
    this.embedder = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );

    // Asegurar que existe el directorio
    await fs.mkdir(this.dbPath, { recursive: true });

    console.error('[3/3] Connecting to LanceDB...');

    // Conectar a LanceDB
    const db = await lancedb.connect(this.dbPath);

    const tableNames = await db.tableNames();

    if (tableNames.includes('knowledge')) {
      // Abrir tabla existente
      this.table = await db.openTable('knowledge');
    } else {
      // Crear tabla nueva (se creará con el primer add)
      this.table = null;
      this.db = db;
    }

    this.isInitialized = true;
    console.error('✓ VectorStore initialized');
  }

  /**
   * MEJORA #5: Warm-up en background
   * Pre-carga modelo para evitar latencia en primera búsqueda
   */
  async warmUp() {
    if (this.isWarmedUp) return;

    try {
      await this.initialize();
      // Solo pre-cargar embedding si hay tabla (evita error de schema)
      if (this.table) {
        // Pre-generar un embedding dummy para cargar modelo en RAM
        await this.generateEmbedding('warm up test');
        this.isWarmedUp = true;
        console.error('✓ Vector search warmed up and ready');
      }
    } catch (error) {
      console.error('⚠ Warm-up failed (non-critical):', error.message);
    }
  }

  /**
   * Generar embedding de un texto con retry y circuit breaker
   * Incluye performance tracking y caching
   */
  async generateEmbedding(text) {
    if (!this.isInitialized) {
      throw new Error('VectorStore not initialized');
    }

    // Check cache first
    const cached = this.embeddingCache.get(text);
    if (cached) {
      return cached.embedding;
    }

    const timer = new PerformanceTimer('embedding');

    try {
      const result = await this.circuitBreakers.embeddings.execute(async () => {
        return await retryWithBackoff(async () => {
          const output = await this.embedder(text, {
            pooling: 'mean',
            normalize: true
          });

          return Array.from(output.data);
        }, this.retryOptions);
      });

      // Cache the result
      this.embeddingCache.set(text, result);

      // Record successful embedding generation
      timer.record('embedding');

      return result;
    } catch (error) {
      // Record failed attempt
      const duration = timer.stop();
      console.error(`Embedding generation failed after ${duration}ms:`, error.message);
      throw error;
    }
  }

  /**
   * Agregar vector a la base de datos con retry
   */
  async addVector(id, text, metadata = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const embedding = await this.generateEmbedding(text);

    // Almacenar TODOS los campos de metadata directamente
    // LanceDB no puede inferir schema de arrays vacíos, usamos JSON string
    const record = {
      id,
      vector: embedding,
      text,
      type: metadata.type,
      content: metadata.content,
      context: metadata.context || '',
      confidence: metadata.confidence,
      verified: metadata.verified || false,
      tags: JSON.stringify(metadata.tags || []),
      timestamp: metadata.timestamp || Date.now(),
      accessCount: metadata.accessCount || 0,
      lastAccessed: metadata.lastAccessed || Date.now(),
      relatedIds: JSON.stringify(metadata.relatedIds || []),
      indexed_at: Date.now()
    };

    await this.circuitBreakers.database.execute(async () => {
      return await retryWithBackoff(async () => {
        if (!this.table) {
          // Crear tabla con el primer registro
          this.table = await this.db.createTable('knowledge', [record]);
        } else {
          await this.table.add([record]);
        }
      }, this.retryOptions);
    });
  }

  /**
   * MEJORA #2: Operación UPDATE
   * Actualiza vector cuando cambia content/context
   */
  async updateVector(id, text, metadata = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Re-generar embedding
    const embedding = await this.generateEmbedding(text);

    // LanceDB no tiene UPDATE directo: delete + add
    await this.deleteVector(id);
    await this.addVector(id, text, metadata);
  }

  /**
   * MEJORA #2: Actualizar solo metadata (sin re-embedear)
   */
  async updateMetadata(id, metadata) {
    if (!this.isInitialized) return;

    // Nota: LanceDB no soporta UPDATE parcial fácilmente
    // Esta es una versión simplificada - mejorar en Fase 2
    const existing = await this.getById(id);
    if (existing) {
      await this.updateVector(id, existing.text, { ...existing, ...metadata });
    }
  }

  /**
   * Búsqueda semántica con graceful degradation
   * Si falla embedding, usa búsqueda por texto
   * Incluye performance tracking
   */
  async search(query, topK = 10, filters = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.table) {
      return []; // No hay vectores aún
    }

    const timer = new PerformanceTimer('search');
    let results;
    let searchType = 'semantic';

    try {
      // Try semantic search first
      const queryEmbedding = await this.generateEmbedding(query);

      results = await this.circuitBreakers.database.execute(async () => {
        return await retryWithBackoff(async () => {
          return await this.table
            .search(queryEmbedding)
            .limit(topK * 2) // Buscar más para filtrar después
            .toArray();
        }, this.retryOptions);
      });

    } catch (error) {
      console.error('⚠ Semantic search failed, falling back to text search:', error.message);
      searchType = 'text-fallback';

      // Graceful degradation: Fall back to text-based search
      results = await this.textSearch(query, topK * 2, filters);
    }

    // Deserializar arrays JSON
    results = results.map(r => ({
      ...r,
      tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags || []),
      relatedIds: typeof r.relatedIds === 'string' ? JSON.parse(r.relatedIds) : (r.relatedIds || [])
    }));

    // Aplicar filtros
    if (filters.type) {
      results = results.filter(r => r.type === filters.type);
    }
    if (filters.minConfidence) {
      results = results.filter(r => r.confidence >= filters.minConfidence);
    }

    // Limitar a topK después de filtros
    const finalResults = results.slice(0, topK);

    // Record search performance
    timer.record('search', {
      query,
      searchType,
      resultsCount: finalResults.length,
      topK,
      filters: Object.keys(filters).length > 0 ? filters : undefined
    });

    return finalResults;
  }

  /**
   * Fallback text-based search (no embeddings)
   */
  async textSearch(query, topK = 10, filters = {}) {
    try {
      const allEntries = await this.getAllEntries();

      const queryLower = query.toLowerCase();

      // Simple text matching
      const matches = allEntries
        .filter(entry => {
          const textContent = `${entry.text} ${entry.content} ${entry.context || ''}`.toLowerCase();
          return textContent.includes(queryLower);
        })
        .sort((a, b) => {
          // Sort by relevance (number of matches)
          const aMatches = `${a.text} ${a.content}`.toLowerCase().split(queryLower).length - 1;
          const bMatches = `${b.text} ${b.content}`.toLowerCase().split(queryLower).length - 1;
          return bMatches - aMatches;
        });

      return matches.slice(0, topK);
    } catch (error) {
      console.error('⚠ Text search also failed:', error.message);
      return [];
    }
  }

  /**
   * Obtener vector por ID
   */
  async getById(id) {
    if (!this.isInitialized || !this.table) return null;

    try {
      const results = await this.table
        .query()
        .where(`id = '${id}'`)
        .limit(1)
        .toArray();

      const result = results[0];
      if (!result) return null;

      // Deserializar arrays JSON
      return {
        ...result,
        tags: typeof result.tags === 'string' ? JSON.parse(result.tags) : (result.tags || []),
        relatedIds: typeof result.relatedIds === 'string' ? JSON.parse(result.relatedIds) : (result.relatedIds || [])
      };
    } catch {
      return null;
    }
  }

  /**
   * Eliminar vector
   */
  async deleteVector(id) {
    if (!this.isInitialized) return;
    await this.table.delete(`id = '${id}'`);
  }

  /**
   * Obtener todos los IDs (para validación de sync)
   */
  async getAllIds() {
    if (!this.isInitialized || !this.table) return [];

    try {
      // Usar countRows para evitar cargar todo
      const count = await this.table.countRows();
      if (count === 0) return [];

      // Cargar solo la columna ID
      const results = await this.table
        .query()
        .select(['id'])
        .toArray();

      return results.map(r => r.id);
    } catch (error) {
      console.error('getAllIds error:', error.message);
      return [];
    }
  }

  /**
   * Obtener todas las entradas completas
   */
  async getAllEntries() {
    if (!this.isInitialized || !this.table) return [];

    try {
      const count = await this.table.countRows();
      if (count === 0) return [];

      const results = await this.table.query().toArray();

      // Deserializar arrays JSON
      return results.map(r => ({
        ...r,
        tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags || []),
        relatedIds: typeof r.relatedIds === 'string' ? JSON.parse(r.relatedIds) : (r.relatedIds || [])
      }));
    } catch (error) {
      console.error('getAllEntries error:', error.message);
      return [];
    }
  }

  /**
   * Contar vectores
   * Actualiza métricas de tamaño de base de datos
   */
  async count() {
    if (!this.isInitialized || !this.table) return 0;

    try {
      const count = await this.table.countRows();

      // Update performance metrics
      performanceMetrics.updateDatabaseSize(count);

      return count;
    } catch {
      return 0;
    }
  }

  /**
   * Obtener métricas de performance
   */
  getPerformanceMetrics() {
    return performanceMetrics.getMetrics();
  }

  /**
   * Obtener resumen de performance
   */
  getPerformanceSummary() {
    return performanceMetrics.getSummary();
  }

  /**
   * MEJORA #3: Migración robusta con checkpoint y recovery
   */
  async migrateFromJSON(entries, options = {}) {
    const { dryRun = false, checkpoint = true } = options;

    const migrationId = Date.now();
    const checkpointPath = path.join(this.dbPath, '..', `migration-${migrationId}.json`);

    const stats = {
      total: entries.length,
      migrated: 0,
      failed: 0,
      failedIds: []
    };

    console.error(`Starting migration: ${entries.length} entries`);

    const batch = [];
    for (const [id, entry] of entries) {
      try {
        const text = `${entry.content} ${entry.context || ''}`;

        if (dryRun) {
          console.error(`[DRY RUN] Would migrate: ${id}`);
          stats.migrated++;
          continue;
        }

        const embedding = await this.generateEmbedding(text);

        batch.push({
          id,
          vector: embedding,
          text,
          type: entry.type,
          confidence: entry.confidence,
          tags: entry.tags,
          indexed_at: Date.now()
        });

        // Batch de 50 (más pequeño para recovery)
        if (batch.length >= 50) {
          if (!this.table) {
            this.table = await this.db.createTable('knowledge', batch);
          } else {
            await this.table.add(batch);
          }
          stats.migrated += batch.length;

          // Checkpoint cada 50
          if (checkpoint) {
            await fs.writeFile(checkpointPath, JSON.stringify({
              migrationId,
              migrated: stats.migrated,
              timestamp: Date.now()
            }));
          }

          const progress = ((stats.migrated / stats.total) * 100).toFixed(1);
          console.error(`  Progress: ${stats.migrated}/${stats.total} (${progress}%)`);
          batch.length = 0;
        }
      } catch (error) {
        stats.failed++;
        stats.failedIds.push(id);
        console.error(`  Failed to migrate ${id}:`, error.message);

        // Abortar si demasiados fallos
        if (stats.failed > 10) {
          throw new Error(`Too many failures (${stats.failed}). Aborting.`);
        }
      }
    }

    // Agregar restantes
    if (batch.length > 0 && !dryRun) {
      if (!this.table) {
        this.table = await this.db.createTable('knowledge', batch);
      } else {
        await this.table.add(batch);
      }
      stats.migrated += batch.length;
    }

    // Limpiar checkpoint si exitoso
    if (checkpoint && stats.failed === 0) {
      await fs.unlink(checkpointPath).catch(() => {});
    }

    console.error(`Migration complete: ${stats.migrated} success, ${stats.failed} failed`);
    return stats;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.embeddingCache.stats();
  }

  /**
   * Clear embedding cache
   */
  clearCache() {
    this.embeddingCache.clear();
  }

  /**
   * Persist cache to disk
   */
  async persistCache() {
    await this.embeddingCache.persist();
  }

  /**
   * Load cache from disk
   */
  async loadCache() {
    await this.embeddingCache.load();
  }

  /**
   * Batch generate embeddings for multiple texts
   * More efficient than individual calls
   */
  async batchGenerateEmbeddings(texts) {
    const results = [];
    const uncached = [];
    const uncachedIndices = [];

    // Check cache first
    texts.forEach((text, idx) => {
      const cached = this.embeddingCache.get(text);
      if (cached) {
        results[idx] = cached.embedding;
      } else {
        uncached.push(text);
        uncachedIndices.push(idx);
      }
    });

    // Generate embeddings for uncached texts
    if (uncached.length > 0) {
      const timer = new PerformanceTimer('batch-embedding');

      try {
        // Process in single batch for efficiency
        const embeddings = await Promise.all(
          uncached.map(text => this.generateEmbedding(text))
        );

        // Fill in results and cache
        embeddings.forEach((embedding, i) => {
          const idx = uncachedIndices[i];
          results[idx] = embedding;
        });

        timer.record('embedding', { batchSize: uncached.length });
      } catch (error) {
        timer.stop();
        throw error;
      }
    }

    return results;
  }
}
