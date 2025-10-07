# 🧠 Self-Improving Memory System

[![npm version](https://badge.fury.io/js/@pytt0n%2Fself-improving-memory-mcp.svg)](https://www.npmjs.com/package/@pytt0n/self-improving-memory-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![GitHub Stars](https://img.shields.io/github/stars/SuperPiTT/self-improving-memory-mcp?style=social)](https://github.com/SuperPiTT/self-improving-memory-mcp/stargazers)

Sistema de memoria auto-evolutivo para proyectos de código con Claude. Captura automáticamente decisiones, errores, soluciones y patrones, evaluando confianza, evitando repetir trabajo y errores. **Nunca pierde contexto gracias al sistema anti-compactación.**

---

## 🚀 Quick Start

### Super Easy Install (2 minutes)

```bash
# Install globally
npm install -g @pytt0n/self-improving-memory-mcp

# Navigate to your project
cd /path/to/your/project

# Run installer
memory-install

# Restart Claude Desktop - Done! 🎉
```

**That's it!** The memory system is now active in your project.

📖 **[Quick Install Guide](QUICK-INSTALL.md)** | **[Full Installation Guide](docs/INSTALLATION.md)**

### Alternative Methods

<details>
<summary><b>Install from GitHub (without NPM account)</b></summary>

```bash
# Clone and link globally
git clone https://github.com/SuperPiTT/self-improving-memory-mcp.git
cd self-improving-memory-mcp
npm install
npm link

# Configure your project
cd /path/to/your/project
memory-install

# Restart Claude Desktop
```

📖 **[Complete guide for GitHub installation](INSTALL-WITHOUT-NPM.md)**
</details>

<details>
<summary><b>NPX from GitHub (one command)</b></summary>

```bash
cd /path/to/your/project
npx github:SuperPiTT/self-improving-memory-mcp memory-install
```
</details>

<details>
<summary><b>NPX from NPM (when published)</b></summary>

```bash
cd /path/to/your/project
npx @pytt0n/self-improving-memory-mcp memory-install
```
</details>

---

## ✨ Características Principales

### 🤖 10 Agentes Automáticos

Sistema proactivo que aprende y optimiza sin intervención manual:

| Agente | Cuándo se Activa | Qué Hace |
|--------|------------------|----------|
| 💬 **User Intent Capture** | Al recibir requests | Captura qué quiere el usuario |
| 🔍 **Pattern Recognition** | Antes de tareas | Busca conocimiento previo |
| ❌ **Error Detection** | Al ocurrir errores | Registra errores en memoria |
| ✅ **Solution Capture** | Al resolver problemas | Guarda soluciones exitosas |
| 📋 **Decision Tracker** | Al tomar decisiones | Recuerda el por qué |
| 🎨 **Style Preferences** | Después de escribir código | Aprende tu estilo |
| 💾 **Session Context** | Al interrumpir trabajo | Preserva el progreso |
| 🚨 **Pre-Compact Interceptor** | A 80% de contexto | Evita pérdida automática |
| 💡 **Context Recovery** | Al iniciar conversación | Recupera estado completo |
| 🎯 **Confidence Evaluator** | Después de aplicar conocimiento | Ajusta calidad |

📖 **[Ver documentación completa de agentes](docs/AGENTS.md)**

---

### 🛡️ Sistema Anti-Compactación

**Problema resuelto:** Claude tiene límite de 200k tokens. Al alcanzarlo, autocompact elimina información.

**Nuestra solución:**
- ⚡ Monitoreo automático de tokens (checkpoint a 80%)
- 💾 Guardado completo del estado antes de pérdida
- 🔄 Recuperación perfecta en nueva conversación
- ✅ **Resultado:** Conversaciones infinitas sin pérdida de contexto

📖 **[Cómo funciona el sistema anti-compactación](docs/ANTI-COMPACTION.md)**

---

### 🗂️ 17 Tipos de Entidades

El sistema captura conocimiento estructurado en 17 tipos:

**Proyecto & Código:**
- `project`, `component`, `dependency`

**Aprendizaje:**
- `error`, `solution`, `pattern`, `insight`, `decision`

**Usuario:**
- `user-intent`, `user-preference`, `requirement`

**Estilo:**
- `style-rule`, `architectural-pattern`, `tool-preference`

**Sesiones:**
- `session-snapshot`, `continuation-point`, `work-in-progress`

---

## 🎯 ¿Por Qué Usar Este Sistema?

| Problema | Solución |
|----------|----------|
| ❌ Repetir trabajo | ✅ Pattern Recognition busca automáticamente conocimiento previo |
| ❌ Repetir errores | ✅ Error Detection + Solution Capture crean base de soluciones |
| ❌ Perder contexto | ✅ Anti-compaction system preserva 100% del estado |
| ❌ Olvidar decisiones | ✅ Decision Tracker registra el razonamiento completo |
| ❌ No aprender preferencias | ✅ Style Preferences + User Intent aprenden tu forma de trabajar |
| ❌ Interrupciones costosas | ✅ Session Context permite retomar exactamente donde dejaste |

---

## 💻 Tres Formas de Usar el Sistema

### 1. MCP Tools (Automático desde Claude)

Los agentes funcionan automáticamente. No requieres hacer nada.

```
Claude detecta tu request → Agentes se activan → Aprendizaje automático
```

### 2. Slash Commands (Comandos Rápidos)

```
/memory-search "authentication"
/memory-stats
/checkpoint
/mh  # Menú de ayuda interactivo
```

📖 **[Lista completa de comandos](docs/COMMANDS.md)**

### 3. CLI (Terminal)

```bash
memory-cli stats
memory-cli search "postgresql"
memory-cli list error
memory-cli export
```

---

## 📊 Ejemplo de Workflow

```
1. 💬 Usuario: "Implementa autenticación JWT"
   → User Intent Capture registra el objetivo

2. 🔍 Claude ejecuta Pattern Recognition
   → Encuentra decisión previa: "Usar bcrypt para passwords"

3. 🛠️ Claude implementa código
   → Style Preferences aprende patrones de código

4. ❌ Error: "bcrypt not installed"
   → Error Detection captura el error

5. ✅ Claude lo resuelve: npm install bcrypt
   → Solution Capture vincula solución al error

6. 📋 Decisión: "JWT expiration: 7 days"
   → Decision Tracker registra la decisión + razones

7. 🚨 Contexto al 85% → Pre-Compact Interceptor
   → Checkpoint automático, resumen generado

8. 💡 Nueva conversación
   → Context Recovery carga todo automáticamente
   → Continúa sin pérdida de información
```

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────┐
│  3 Interfaces de Acceso                         │
│  • MCP Tools  • Slash Commands  • CLI           │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  MCP Server (index.js)                          │
│  • API Layer                                    │
│  • 8 herramientas MCP                           │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  KnowledgeStore (lógica de negocio)             │
│  • Gestión de entidades y relaciones            │
│  • Sistema de confianza                         │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  VectorStore (vector-store.js)                  │
│  • LanceDB - Base de datos vectorial            │
│  • Transformers.js - Embeddings (384D)          │
│  • Búsqueda semántica                           │
└─────────────────────────────────────────────────┘
```

📖 **[Arquitectura detallada](docs/ARCHITECTURE.md)**

---

## 📦 Estructura del Proyecto

```
self-improve-claude/
├── README.md                    # Este archivo
├── ROADMAP.md                   # Plan de mejoras futuras
├── package.json
│
├── index.js                     # MCP Server (~400 líneas)
├── memory-cli.js                # CLI Tool (~300 líneas)
├── vector-store.js              # Vector storage (~250 líneas)
│
├── .claude/
│   ├── CLAUDE.md               # Instrucciones para Claude
│   ├── settings.local.json     # Permisos auto-aprobados
│   │
│   ├── agents/                 # 10 agentes automáticos
│   │   ├── pattern-recognition.md
│   │   ├── error-detector.md
│   │   ├── solution-capture.md
│   │   ├── decision-tracker.md
│   │   ├── confidence-evaluator.md
│   │   ├── user-intent-capture.md
│   │   ├── style-preferences.md
│   │   ├── session-context.md
│   │   ├── pre-compact-interceptor.md
│   │   └── context-recovery.md
│   │
│   └── commands/               # Slash commands
│       ├── memory-stats.md
│       ├── memory-search.md
│       ├── checkpoint.md
│       └── mh.md               # Menú de ayuda
│
├── docs/                       # Documentación organizada
│   ├── INSTALLATION.md         # Guía de instalación completa
│   ├── AGENTS.md               # Documentación de agentes
│   ├── ARCHITECTURE.md         # Diseño del sistema
│   ├── ANTI-COMPACTION.md      # Sistema de preservación de contexto
│   ├── COMMANDS.md             # Referencia de comandos
│   ├── API.md                  # Referencia de herramientas MCP
│   └── BEST-PRACTICES.md       # Mejores prácticas de uso
│
├── tests/                      # Tests (en desarrollo)
│   └── README.md
│
└── .claude-memory/             # Base de datos (auto-creada)
    └── vectors/
        └── lancedb/            # Almacenamiento vectorial
```

> **Nota:** Mantenemos archivos <500 líneas siguiendo principios SOLID y organización modular.

---

## 🔧 Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **LanceDB** | v0.22.1 | Base de datos vectorial persistente |
| **Transformers.js** | v2.17.2 | Embeddings semánticos (all-MiniLM-L6-v2) |
| **MCP SDK** | latest | Protocol comunicación con Claude Desktop |
| **Node.js** | v18+ | Runtime (ES Modules) |

---

## 📖 Documentación Completa

- 📘 **[Instalación](docs/INSTALLATION.md)** - Configuración paso a paso
- 🤖 **[Agentes](docs/AGENTS.md)** - Los 10 agentes automáticos
- 🏗️ **[Arquitectura](docs/ARCHITECTURE.md)** - Diseño del sistema
- 🛡️ **[Anti-Compactación](docs/ANTI-COMPACTION.md)** - Sistema de preservación de contexto
- ⚡ **[Comandos](docs/COMMANDS.md)** - Slash commands y CLI
- 🔌 **[API Reference](docs/API.md)** - Herramientas MCP
- ✅ **[Mejores Prácticas](docs/BEST-PRACTICES.md)** - Cómo usar eficientemente

---

## 🗺️ Roadmap

Ver **[ROADMAP.md](ROADMAP.md)** para el plan completo de mejoras futuras.

**Próximas prioridades:**
- 🧪 Framework de testing completo
- 📊 Dashboard de visualización de conocimiento
- 🔄 Auto-refactoring de código duplicado
- 🌐 API REST para integración externa
- 📈 Métricas de performance y optimización

---

## 🔧 Actualizaciones Recientes

### 2025-10-07: Corrección Crítica del Sistema Anti-Compactación

**Problema identificado:** El sistema de interceptación de autocompact no se activaba automáticamente.

**Causa:** Las instrucciones en `.claude/CLAUDE.md` eran pasivas ("Monitor token usage") en lugar de activas con triggers explícitos.

**Solución implementada:**

1. ✅ **Header visual obligatorio** al inicio de CLAUDE.md:
   ```
   ⚠️ CHECK CONTEXT USAGE FIRST - MANDATORY ⚠️
   If >= 160k tokens (80%): STOP and launch Pre-Compact Interceptor
   ```

2. ✅ **Protocolo de monitoreo explícito** con 3 pasos:
   - Step 1: Check on EVERY response
   - Step 2: Checkpoint Protocol (STOP → save → present summary)
   - Step 3: Recovery (auto-load in new conversation)

3. ✅ **Reglas de trigger sin excepciones**:
   - Tokens >= 160k (80%): TRIGGER
   - Messages >= 40: TRIGGER
   - Before large ops: Estimate & TRIGGER

4. ✅ **Context Recovery más proactivo**:
   - Se activa en TODAS las conversaciones nuevas (primeros 1-2 mensajes)
   - Búsqueda automática de checkpoints < 24 horas
   - Presenta opción de recuperación sin que usuario pregunte

5. ✅ **Documentación de testing completa**:
   - Nuevo archivo: `docs/CHECKPOINT-TESTING.md`
   - 6 escenarios de prueba detallados
   - Guía de troubleshooting
   - Métricas de éxito

**Impacto:** CRÍTICO - Este es el mecanismo que previene pérdida de información en conversaciones largas. Sin esto, el sistema pierde contexto cuando autocompact se activa (~200k tokens).

**Estado:** ✅ CORREGIDO

📖 **[Ver guía completa de testing](docs/CHECKPOINT-TESTING.md)**
📖 **[Ver detalles técnicos en PROGRESS.md](PROGRESS.md#🔧-corrección-crítica---2025-10-07)**

---

## 🤝 Contribuir

¿Ideas para mejorar el sistema?

1. Revisa el [ROADMAP.md](ROADMAP.md)
2. Abre un issue con tu propuesta
3. Las contribuciones son bienvenidas

**Principios del proyecto:**
- ✅ Archivos <500 líneas (SOLID cuando necesario)
- ✅ Documentación clara con referencias
- ✅ Tests para funcionalidad crítica
- ✅ Auto-aprendizaje automático, no manual

---

## 📄 Licencia

MIT

---

**🧠 El conocimiento de tu proyecto ahora tiene memoria perpetua. Claude nunca olvida.**
