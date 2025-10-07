# 🏗️ Arquitectura del Sistema

Diseño técnico completo del sistema de memoria auto-evolutivo.

---

## 📋 Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura de 3 Capas](#arquitectura-de-3-capas)
3. [Flujo de Datos](#flujo-de-datos)
4. [Componentes Principales](#componentes-principales)
5. [Sistema de Entidades y Relaciones](#sistema-de-entidades-y-relaciones)
6. [Decisiones de Diseño](#decisiones-de-diseño)

---

## Visión General

### Principios Arquitectónicos

**SOLID Principles:**
- ✅ **Single Responsibility:** Cada componente tiene una responsabilidad clara
- ✅ **Open/Closed:** Extensible mediante agentes y plugins sin modificar core
- ✅ **Liskov Substitution:** VectorStore puede intercambiarse por otras implementaciones
- ✅ **Interface Segregation:** Interfaces pequeñas y específicas
- ✅ **Dependency Inversion:** KnowledgeStore depende de abstracción, no implementación

**Otros Principios:**
- 🔄 **Separation of Concerns:** API, lógica, persistencia separadas
- 📦 **Modular Design:** Componentes independientes y reutilizables
- 🎯 **Single Source of Truth:** LanceDB es la única fuente de datos
- 🔌 **Plugin Architecture:** Agentes como plugins auto-contenidos

---

## Arquitectura de 3 Capas

```
┌──────────────────────────────────────────────────────────────────┐
│                    CAPA 1: INTERFACES                            │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐     │
│  │  MCP Tools  │  │   Slash     │  │   CLI (terminal)     │     │
│  │   (Claude)  │  │  Commands   │  │  memory-cli stats    │     │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬───────────┘     │
│         │                │                     │                 │
└─────────┼────────────────┼─────────────────────┼─────────────────┘
          │                │                     │
          └────────────────┴─────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    CAPA 2: LÓGICA DE NEGOCIO                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   MCP Server (index.js)                   │   │
│  │  • Transport Layer (StdioServerTransport)                 │   │
│  │  • Tool Registration & Routing                            │   │
│  │  • Request Validation (Zod schemas)                       │   │
│  │  • Error Handling                                         │   │
│  └──────────────────┬───────────────────────────────────────┘   │
│                     │                                            │
│  ┌──────────────────▼───────────────────────────────────────┐   │
│  │              KnowledgeStore (class)                       │   │
│  │  • Entity Management (CRUD)                               │   │
│  │  • Relation Management                                    │   │
│  │  • Confidence System                                      │   │
│  │  • Search & Retrieval                                     │   │
│  │  • Stats & Analytics                                      │   │
│  │  • Export Functionality                                   │   │
│  └──────────────────┬───────────────────────────────────────┘   │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                  CAPA 3: PERSISTENCIA                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              VectorStore (vector-store.js)                │   │
│  │  • Embedding Generation (Transformers.js)                 │   │
│  │  • Vector Operations (add, search, update, delete)        │   │
│  │  • LanceDB Abstraction                                    │   │
│  │  • Schema Management                                      │   │
│  └──────────────────┬───────────────────────────────────────┘   │
│                     │                                            │
│  ┌──────────────────▼───────────────────────────────────────┐   │
│  │                  LanceDB Storage                          │   │
│  │  • Vector Database (.claude-memory/vectors/lancedb/)      │   │
│  │  • Persistent Storage                                     │   │
│  │  • Efficient Vector Search                                │   │
│  └───────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Flujo de Datos

### 1. User Request → Knowledge Capture

```
┌──────────┐
│  Usuario │ "Guarda decisión: Usar PostgreSQL"
└────┬─────┘
     │
     ▼
┌─────────────────┐
│  MCP Tool Call  │ save_knowledge({type: "decision", content: "..."})
└────┬────────────┘
     │
     ▼
┌────────────────────┐
│  Input Validation  │ Zod schema validation
└────┬───────────────┘
     │
     ▼
┌──────────────────────┐
│  KnowledgeStore      │ addEntry({...})
│  • Generate UUID     │
│  • Set metadata      │
│  • Prepare for store │
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│  VectorStore         │ add({...})
│  • Generate embedding│ Transformers.js (384D vector)
│  • Serialize arrays  │ tags → JSON string
│  • Insert to LanceDB │
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│  LanceDB             │ Persistent storage
│  • Write to disk     │
│  • Index vector      │
└──────────────────────┘
```

### 2. Knowledge Search

```
┌──────────┐
│  Usuario │ "Busca decisiones sobre database"
└────┬─────┘
     │
     ▼
┌─────────────────┐
│  MCP Tool Call  │ search_knowledge({query: "database"})
└────┬────────────┘
     │
     ▼
┌──────────────────────┐
│  KnowledgeStore      │ search("database", {type: "decision"})
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│  VectorStore         │ search("database", limit: 10)
│  • Generate embedding│ Query → 384D vector
│  • Vector search     │ Cosine similarity
│  • Filter results    │ By type, confidence
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│  LanceDB             │ Vector similarity search
│  • ANN search        │ Approximate Nearest Neighbors
│  • Return top K      │
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│  Post-Processing     │
│  • Deserialize arrays│ JSON string → array
│  • Update metadata   │ accessCount++, lastAccessed
│  • Format response   │
└────┬─────────────────┘
     │
     ▼
┌──────────┐
│  Results │ [{id, type, content, confidence, ...}, ...]
└──────────┘
```

### 3. Agent Workflow

```
┌──────────┐
│  Trigger │ Error occurs, task starts, etc.
└────┬─────┘
     │
     ▼
┌─────────────────┐
│  Claude detects │ Matches trigger condition in CLAUDE.md
│  trigger         │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Task tool call │ Launch agent (subagent_type: "general-purpose")
└────┬────────────┘
     │
     ▼
┌──────────────────────┐
│  Agent executes      │
│  1. Search memory    │ mcp__memory__search_nodes
│  2. Analyze findings │
│  3. Create entities  │ mcp__memory__create_entities
│  4. Create relations │ mcp__memory__create_relations
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│  Knowledge stored    │ Entities + Relations in LanceDB
└────┬─────────────────┘
     │
     ▼
┌──────────┐
│  Report  │ Brief confirmation to Claude
└──────────┘
```

---

## Componentes Principales

### 1. MCP Server (`index.js`)

**Responsabilidad:** API Layer y Transport

**Componentes:**
```javascript
// Server initialization
const server = new Server({
  name: 'self-improving-memory',
  version: '2.0.0'
}, {
  capabilities: {
    tools: {}  // Expose MCP tools
  }
});

// Transport (stdio para Claude Desktop)
const transport = new StdioServerTransport();

// Tool registration
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { name: 'create_entities', ... },
    { name: 'search_nodes', ... },
    ...
  ]
}));

// Tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Route to KnowledgeStore
});
```

**Herramientas Expuestas:**
1. `create_entities` - Crear entidades
2. `create_relations` - Crear relaciones
3. `add_observations` - Agregar observaciones
4. `search_nodes` - Buscar conocimiento
5. `open_nodes` - Abrir entidades específicas
6. `read_graph` - Leer grafo completo
7. `delete_entities` - Eliminar entidades
8. `delete_observations` - Eliminar observaciones

**Patterns Utilizados:**
- **Factory Pattern:** Para crear entidades
- **Strategy Pattern:** Routing de tools
- **Facade Pattern:** Simplifica acceso a KnowledgeStore

---

### 2. KnowledgeStore (clase en `index.js`)

**Responsabilidad:** Business Logic

**Métodos Principales:**

```javascript
class KnowledgeStore {
  constructor(projectPath) {
    this.vectorStore = new VectorStore(projectPath);
  }

  // Entity Management
  async addEntry({ type, content, context, confidence, ... }) {
    const id = crypto.randomUUID();
    const entry = {
      id,
      type,
      content,
      context,
      confidence,
      verified: false,
      tags: [],
      timestamp: new Date().toISOString(),
      accessCount: 0,
      lastAccessed: null,
      relatedIds: []
    };
    await this.vectorStore.add(entry);
    return id;
  }

  // Search with filters
  async search(query, { type, minConfidence, limit } = {}) {
    const results = await this.vectorStore.search(query, limit);

    // Filter by type
    if (type) {
      results = results.filter(r => r.type === type);
    }

    // Filter by confidence
    if (minConfidence) {
      results = results.filter(r => r.confidence >= minConfidence);
    }

    // Update access metadata
    for (const result of results) {
      await this.updateMetadata(result.id, {
        accessCount: result.accessCount + 1,
        lastAccessed: new Date().toISOString()
      });
    }

    return results;
  }

  // Relation Management
  async linkEntries(fromId, toId, relationType) {
    const from = await this.getById(fromId);
    if (!from.relatedIds.includes(toId)) {
      from.relatedIds.push(toId);
      await this.updateEntry(fromId, { relatedIds: from.relatedIds });
    }
  }

  // Analytics
  async getStats() {
    const allEntries = await this.vectorStore.getAll();

    return {
      totalEntries: allEntries.length,
      byType: this.groupBy(allEntries, 'type'),
      byConfidence: this.groupByConfidence(allEntries),
      verified: allEntries.filter(e => e.verified).length,
      mostAccessedId: this.findMostAccessed(allEntries)?.id
    };
  }

  // Export
  async exportMarkdown() {
    const entries = await this.vectorStore.getAll();
    const grouped = this.groupBy(entries, 'type');

    let md = '# Knowledge Base Export\n\n';
    for (const [type, items] of Object.entries(grouped)) {
      md += `## ${type}\n\n`;
      for (const item of items) {
        md += `### ${item.content}\n`;
        md += `- Confidence: ${item.confidence}\n`;
        md += `- Tags: ${item.tags.join(', ')}\n\n`;
      }
    }

    return md;
  }
}
```

**Patterns Utilizados:**
- **Repository Pattern:** Abstrae acceso a datos
- **Builder Pattern:** Construcción de queries complejas
- **Template Method:** Export en diferentes formatos

---

### 3. VectorStore (`vector-store.js`)

**Responsabilidad:** Vector Operations & LanceDB Abstraction

**Componentes:**

```javascript
class VectorStore {
  constructor(projectPath) {
    this.dbPath = path.join(projectPath, '.claude-memory', 'vectors', 'lancedb');
    this.db = null;
    this.table = null;
    this.model = null;  // Transformers.js model
  }

  // Initialization
  async initialize() {
    this.db = await lancedb.connect(this.dbPath);

    // Check if table exists
    const tableNames = await this.db.tableNames();
    if (tableNames.includes('knowledge')) {
      this.table = await this.db.openTable('knowledge');
    } else {
      // Create table with schema
      this.table = await this.db.createTable('knowledge', SCHEMA);
    }

    // Warm-up embeddings model in background
    this.warmupModel();
  }

  // Embedding generation
  async generateEmbedding(text) {
    if (!this.model) {
      const { pipeline } = await import('@xenova/transformers');
      this.model = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
    }

    const output = await this.model(text, {
      pooling: 'mean',
      normalize: true
    });

    return Array.from(output.data);  // 384D vector
  }

  // Add entry
  async add(entry) {
    const embedding = await this.generateEmbedding(
      `${entry.type} ${entry.content} ${entry.context || ''}`
    );

    const record = {
      id: entry.id,
      vector: embedding,
      text: entry.content,
      type: entry.type,
      content: entry.content,
      context: entry.context || '',
      confidence: entry.confidence,
      verified: entry.verified,
      tags: JSON.stringify(entry.tags),  // Serialize
      timestamp: entry.timestamp,
      accessCount: entry.accessCount,
      lastAccessed: entry.lastAccessed || '',
      relatedIds: JSON.stringify(entry.relatedIds),  // Serialize
      indexed_at: new Date().toISOString()
    };

    await this.table.add([record]);
  }

  // Vector search
  async search(query, limit = 10) {
    const queryEmbedding = await this.generateEmbedding(query);

    const results = await this.table
      .search(queryEmbedding)
      .limit(limit)
      .execute();

    // Deserialize arrays
    return results.map(r => ({
      ...r,
      tags: JSON.parse(r.tags || '[]'),
      relatedIds: JSON.parse(r.relatedIds || '[]')
    }));
  }

  // Update (delete + add pattern)
  async update(id, updates) {
    const existing = await this.getById(id);
    const merged = { ...existing, ...updates };

    await this.delete(id);
    await this.add(merged);
  }

  // Metadata-only update (no re-embed)
  async updateMetadata(id, metadata) {
    // Direct SQL update for efficiency (no vector change)
    const sql = `UPDATE knowledge SET ${Object.keys(metadata).map(k => `${k} = ?`).join(', ')} WHERE id = ?`;
    await this.table.execute(sql, [...Object.values(metadata), id]);
  }
}
```

**Patterns Utilizados:**
- **Singleton Pattern:** Model instance reutilizada
- **Lazy Loading:** Model se carga en primer uso
- **Adapter Pattern:** Abstrae LanceDB specifics

---

### 4. CLI Tool (`memory-cli.js`)

**Responsabilidad:** Terminal Interface

**Comandos:**

```javascript
const commands = {
  init: async () => {
    // Initialize .claude-memory directory
  },

  stats: async () => {
    const store = new VectorStore(process.cwd());
    const stats = await store.getStats();
    console.log(formatStats(stats));
  },

  list: async (type) => {
    const entries = await store.getAll();
    const filtered = type ? entries.filter(e => e.type === type) : entries;
    console.table(filtered.map(formatEntry));
  },

  search: async (query) => {
    const results = await store.search(query);
    console.log(formatResults(results));
  },

  show: async (id) => {
    const entry = await store.getById(id);
    console.log(formatDetail(entry));
  },

  export: async (format = 'md') => {
    if (format === 'md') {
      const md = await store.exportMarkdown();
      fs.writeFileSync('knowledge-export.md', md);
    }
  },

  analyze: async () => {
    // Quality analysis
    const entries = await store.getAll();
    const lowConfidence = entries.filter(e => e.confidence < 0.5);
    const unverified = entries.filter(e => !e.verified);
    const unused = entries.filter(e => e.accessCount === 0);

    console.log(`Low confidence: ${lowConfidence.length}`);
    console.log(`Unverified: ${unverified.length}`);
    console.log(`Unused: ${unused.length}`);
  }
};
```

**Features:**
- Acceso directo a VectorStore (no usa MCP)
- Formateo con colores ANSI
- Instalable globalmente (`npm link`)

---

## Sistema de Entidades y Relaciones

### Entity Schema

```typescript
interface Entity {
  // Identity
  id: string;              // UUID v4
  name: string;            // Human-readable name
  entityType: string;      // Tipo de entidad (17 tipos)

  // Content
  observations: string[];  // Array de observaciones

  // Metadata (implicit)
  confidence?: number;     // 0-1 (stored in observations)
  tags?: string[];         // (stored in observations)
  timestamp?: string;      // ISO8601
  verified?: boolean;      // (stored in observations)
}
```

### Relation Schema

```typescript
interface Relation {
  from: string;            // Entity name (source)
  to: string;              // Entity name (target)
  relationType: string;    // Tipo de relación
}
```

### Entity Types (17 tipos)

**Categoría: Proyecto & Código**
- `project` - Información del proyecto
- `component` - Componente/módulo de código
- `dependency` - Librería/herramienta externa

**Categoría: Aprendizaje**
- `error` - Error encontrado
- `solution` - Solución exitosa
- `pattern` - Patrón reutilizable
- `insight` - Aprendizaje importante
- `decision` - Decisión técnica

**Categoría: Usuario**
- `user-intent` - Qué quiere lograr el usuario
- `user-preference` - Preferencias del usuario
- `requirement` - Requisito o constraint

**Categoría: Estilo**
- `style-rule` - Regla de estilo de código
- `architectural-pattern` - Patrón arquitectónico
- `tool-preference` - Herramienta/library preferida

**Categoría: Sesiones**
- `session-snapshot` - Estado completo de sesión
- `continuation-point` - Punto de continuación
- `work-in-progress` - Trabajo incompleto

### Relation Types (ejemplos)

```
uses, depends on, fixes, implements, supersedes,
applies to, guided by, causes, prevents, enhances,
similar to, contradicts, requires, validates, extends
```

### Knowledge Graph Structure

```
                    ┌──────────────┐
                    │   PROJECT    │
                    │ my-web-app   │
                    └───────┬──────┘
                            │ uses
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
      ┌──────────┐  ┌──────────┐  ┌──────────┐
      │COMPONENT │  │COMPONENT │  │DEPENDENCY│
      │  Auth    │  │   API    │  │PostgreSQL│
      └────┬─────┘  └────┬─────┘  └────┬─────┘
           │             │              │
           │ implements  │ applies to   │ used in
           ▼             ▼              ▼
      ┌──────────┐  ┌──────────┐  ┌──────────┐
      │ DECISION │  │  ERROR   │  │DECISION  │
      │ Use JWT  │  │ CORS fail│  │ Use PG   │
      └────┬─────┘  └────┬─────┘  └──────────┘
           │             │ fixed by
           │ guided by   ▼
           ▼        ┌──────────┐
      ┌──────────┐  │ SOLUTION │
      │USER-PREF │  │Enable    │
      │Secure    │  │CORS      │
      └──────────┘  └──────────┘
```

---

## Decisiones de Diseño

### 1. ¿Por qué LanceDB?

**Alternativas consideradas:**
- Pinecone (cloud-only, caro)
- Weaviate (overhead alto)
- ChromaDB (más lento)
- JSON + manual search (no escala)

**Razones para LanceDB:**
- ✅ Persistencia local (no depende de cloud)
- ✅ Vector search nativo y rápido
- ✅ Bajo overhead (embedded database)
- ✅ Escalable (hasta millones de vectores)
- ✅ Integración fácil con Node.js

### 2. ¿Por qué Transformers.js?

**Alternativas:**
- OpenAI Embeddings API (requiere API key, costo)
- Python sentence-transformers (requiere Python)
- Manual TF-IDF (menos semántico)

**Razones para Transformers.js:**
- ✅ 100% JavaScript (no Python dependency)
- ✅ Funciona offline (modelo local)
- ✅ Gratis y open-source
- ✅ Modelo pequeño pero efectivo (90MB)
- ✅ Rápido después de warm-up

### 3. ¿Por qué Modelo all-MiniLM-L6-v2?

**Specs:**
- Tamaño: ~90MB
- Dimensiones: 384
- Performance: 0.68 semantic similarity (benchmark)

**Trade-offs:**
- ✅ Pequeño y rápido
- ✅ Buena precisión para mayoría de casos
- ❌ No tan preciso como modelos grandes (768D)

**Conclusión:** Sweet spot entre tamaño/velocidad/precisión.

### 4. ¿Por qué 3 Capas?

**Separation of Concerns:**
- **Layer 1 (Interfaces):** Múltiples formas de interactuar
- **Layer 2 (Logic):** Business rules independientes de storage
- **Layer 3 (Persistence):** Fácil cambiar implementación

**Benefits:**
- Testeable (mock layers independientemente)
- Mantenible (cambios localizados)
- Extensible (agregar interfaces fácilmente)

### 5. ¿Por qué MCP Protocol?

**Alternativas:**
- REST API (overhead de servidor)
- GraphQL (complejidad innecesaria)
- Direct function calls (no portable)

**Razones para MCP:**
- ✅ Standard de Anthropic para Claude integrations
- ✅ Stdio transport (simple, sin networking)
- ✅ Schema validation built-in
- ✅ Auto-discovery de tools

### 6. ¿Por qué No JSON Storage?

**Problemas con JSON:**
- ❌ No search semántica (solo text match)
- ❌ O(n) para búsquedas
- ❌ No escala bien (>10k entries)
- ❌ Require cargar todo en memoria

**Benefits de Vector DB:**
- ✅ O(log n) búsqueda con ANN
- ✅ Semantic search (encuentra conceptos similares)
- ✅ Escalable sin límite práctico
- ✅ Lazy loading (no todo en RAM)

---

## Performance Considerations

### Latency Breakdown

```
Total search time: ~300-500ms

1. Query embedding generation: ~100-200ms (primera vez)
                               ~10-20ms (warm model)

2. Vector search (LanceDB):    ~50-100ms (10k entries)
                               ~200-300ms (100k entries)

3. Post-processing:            ~10-20ms

4. Metadata update:            ~20-50ms
```

### Memory Usage

```
Base:                ~50MB (Node.js runtime)
Transformers.js:     ~90MB (model in memory)
LanceDB:             ~20MB + (vectors * 384 * 4 bytes)

Example for 10k entries:
10,000 * 384 * 4 = ~15MB

Total: ~175MB (10k entries)
       ~265MB (100k entries)
```

### Scalability Targets

| Entries | DB Size | Search Latency | Memory  |
|---------|---------|----------------|---------|
| 1k      | ~5MB    | <100ms         | ~165MB  |
| 10k     | ~50MB   | <200ms         | ~175MB  |
| 100k    | ~500MB  | <500ms         | ~265MB  |
| 1M      | ~5GB    | <1s            | ~500MB  |

---

## Security Considerations

### Data Privacy

- ✅ **Local-first:** Todo almacenado localmente
- ✅ **No cloud:** No envía datos a servicios externos
- ✅ **No tracking:** No telemetría
- ✅ **User control:** Usuario controla sus datos

### Input Validation

```javascript
// Zod schemas para validación
const EntitySchema = z.object({
  name: z.string().min(1).max(200),
  entityType: z.enum([...17 entity types]),
  observations: z.array(z.string()).min(1)
});

// Sanitización
function sanitize(input) {
  return input
    .trim()
    .replace(/[<>]/g, '')  // Remove HTML tags
    .slice(0, 10000);      // Limit length
}
```

### Error Handling

```javascript
try {
  await vectorStore.add(entity);
} catch (error) {
  logger.error('Failed to add entity', {
    error: error.message,
    stack: error.stack,
    entity: sanitizeForLog(entity)
  });
  throw new MCPError('Entity creation failed');
}
```

---

**Documentación relacionada:**
- [Agentes](AGENTS.md)
- [API Reference](API.md)
- [ROADMAP](../ROADMAP.md)
