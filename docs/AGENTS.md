# 🤖 Agentes Automáticos - Documentación Completa

Los agentes son el corazón del sistema de auto-aprendizaje. Se activan automáticamente según triggers específicos y trabajan de forma silenciosa, capturando conocimiento sin intervención manual.

---

## 📋 Tabla de Contenidos

1. [Cómo Funcionan los Agentes](#cómo-funcionan-los-agentes)
2. [Los 10 Agentes del Sistema](#los-10-agentes-del-sistema)
3. [Workflow de Interacción](#workflow-de-interacción)
4. [Crear Agentes Personalizados](#crear-agentes-personalizados)

---

## Cómo Funcionan los Agentes

### Características Principales

- ✅ **Automáticos:** Se activan según triggers predefinidos
- ✅ **Silenciosos:** Trabajan en background sin interrumpir
- ✅ **Auto-aprobados:** No requieren confirmación del usuario
- ✅ **Proactivos:** Anticipan necesidades antes de que se pidan
- ✅ **Inteligentes:** Usan búsqueda semántica y context awareness

### Arquitectura de Agentes

```
┌─────────────────────────────────────────────┐
│  Trigger Detection (Claude)                 │
│  • User message                             │
│  • Error occurs                             │
│  • Task completed                           │
│  • Context threshold reached                │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Agent Activation (Task tool)               │
│  • subagent_type: "general-purpose"         │
│  • Prompt with context                      │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Agent Execution                            │
│  • Search memory (mcp__memory__search)      │
│  • Capture knowledge (mcp__memory__create)  │
│  • Link entities (mcp__memory__relations)   │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Silent Confirmation                        │
│  • Brief status message                     │
│  • Relevant findings (if any)               │
│  • Continue workflow                        │
└─────────────────────────────────────────────┘
```

---

## Los 10 Agentes del Sistema

### 1. 💬 User Intent Capture Agent

**Archivo:** `.claude/agents/user-intent-capture.md`

**Trigger:**
- Usuario escribe un request o tarea
- Usuario especifica requisitos o constraints
- Usuario expresa preferencias sobre implementación
- Usuario da feedback sobre soluciones

**Propósito:**
Capturar **qué quiere el usuario**, **cómo lo quiere**, y **por qué**. Nunca olvidar intenciones del usuario.

**Tipos de Entidades Creadas:**
- `user-intent` - El objetivo principal que busca el usuario
- `user-preference` - Preferencias sobre cómo hacer las cosas
- `requirement` - Constraints y especificaciones técnicas

**Ejemplo de Uso:**

```
Usuario: "Implementa autenticación JWT con refresh tokens.
          Quiero que sea seguro y que expire en 7 días."

→ User Intent Capture Agent se activa:

Entities creadas:
1. user-intent: "Implementar sistema de autenticación JWT"
   Observations:
   - Requiere JWT tokens para autenticación
   - Debe incluir refresh tokens
   - Expiración configurada a 7 días
   - Prioridad en seguridad

2. requirement: "JWT expiration: 7 días"
   Confidence: 1.0 (explícito)

3. user-preference: "Priorizar seguridad en autenticación"
   Confidence: 0.9
```

**Relaciones Creadas:**
- `user-intent` → `implements` → `requirement`
- `user-intent` → `guided by` → `user-preference`

---

### 2. 🔍 Pattern Recognition Agent

**Archivo:** `.claude/agents/pattern-recognition.md`

**Trigger:**
- **ANTES de iniciar cualquier tarea no trivial**
- Usuario reporta un bug o problema
- Usuario pide consejo arquitectónico
- Antes de escribir código

**Propósito:**
Buscar conocimiento previo relevante en memoria. Prevenir trabajo repetido y errores ya conocidos.

**Búsquedas Que Realiza:**
1. Decisiones técnicas relacionadas
2. Errores similares previos
3. Soluciones aplicables
4. Patrones relevantes
5. User preferences relacionadas

**Ejemplo de Uso:**

```
Usuario: "Implementa caché para la API"

→ Pattern Recognition Agent se activa PRIMERO:

Busca en memoria:
- "caché", "caching", "API", "performance"

Encuentra:
✅ Decisión previa: "Usar Redis para caché distribuido"
   (Confidence: 0.9, Reason: "Escalabilidad")

✅ Error previo: "Memory cache pierde datos en restart"
   Solución vinculada: "Usar Redis persistente"

✅ User preference: "Preferir soluciones cloud-native"

Claude aplica conocimiento:
- Usa Redis directamente (no inventa otra solución)
- Evita memory cache (error conocido)
- Considera cloud-native (preferencia usuario)
```

**Resultado:**
- ⚡ Ahorra tiempo (no re-investigar)
- ✅ Evita errores conocidos
- 🎯 Aplica preferencias aprendidas

---

### 3. ❌ Error Detection Agent

**Archivo:** `.claude/agents/error-detector.md`

**Trigger:**
- Comando Bash falla (exit code ≠ 0)
- Código lanza excepción
- Tests fallan
- Build falla
- Diagnostics muestran errores

**Propósito:**
Capturar errores con contexto completo para prevenir recurrencia.

**Tipos de Entidades Creadas:**
- `error` - El error encontrado

**Información Capturada:**
- Mensaje de error completo
- Stack trace
- Comando/código que falló
- Contexto: qué se estaba intentando hacer
- Timestamp

**Ejemplo de Uso:**

```
$ npm install bcrypt
Error: node-gyp rebuild failed

→ Error Detection Agent se activa:

Entity creada:
- error: "bcrypt installation failed - node-gyp"
  Observations:
  - Error message: "node-gyp rebuild failed"
  - Command: "npm install bcrypt"
  - Context: "Installing bcrypt for password hashing"
  - Likely cause: "Missing build tools"
  - Timestamp: 2025-10-07T10:30:00Z
  Confidence: 1.0 (error real)
  Tags: ["dependency", "build-error", "bcrypt"]
```

**Nota:** Agente NO intenta resolver, solo captura. Solution Capture se activa cuando se resuelva.

---

### 4. ✅ Solution Capture Agent

**Archivo:** `.claude/agents/solution-capture.md`

**Trigger:**
- Comando previamente fallido ahora funciona
- Error resuelto después de cambios
- Usuario confirma que algo funciona
- Diagnostics errors cleared

**Propósito:**
Capturar **qué funcionó** y **vincular a error que resolvió**.

**Tipos de Entidades Creadas:**
- `solution` - La solución exitosa

**Información Capturada:**
- Qué se hizo para resolver
- Por qué funcionó
- Link al error que resuelve
- Confidence basado en verificación

**Ejemplo de Uso:**

```
(Continuando ejemplo anterior)

$ sudo apt-get install build-essential
$ npm install bcrypt
✅ Success!

→ Solution Capture Agent se activa:

Entity creada:
- solution: "Install build-essential for bcrypt"
  Observations:
  - Action: "sudo apt-get install build-essential"
  - Why it worked: "Provides gcc/g++ for node-gyp"
  - Verification: "npm install bcrypt succeeded"
  Confidence: 1.0 (verificado)
  Tags: ["dependency", "build-tools", "bcrypt"]

Relation creada:
- solution "Install build-essential" → fixes → error "bcrypt installation failed"
```

**Resultado:**
Próxima vez que ocurra error similar, Pattern Recognition lo encontrará y aplicará solución automáticamente.

---

### 5. 📋 Decision Tracker Agent

**Archivo:** `.claude/agents/decision-tracker.md`

**Trigger:**
- Elección entre alternativas (X vs Y)
- Decisión arquitectónica
- Selección de dependencia o herramienta
- Usuario hace elección definitiva después de discusión

**Propósito:**
Capturar **por qué se decidió algo**. Prevenir re-discutir decisiones ya tomadas.

**Tipos de Entidades Creadas:**
- `decision` - La decisión técnica tomada

**Información Capturada:**
- Qué se decidió
- Alternativas consideradas
- Razones de la elección
- Trade-offs aceptados
- Contexto y constraints

**Ejemplo de Uso:**

```
Claude: "¿PostgreSQL o MongoDB?"
Usuario: "PostgreSQL, necesitamos transacciones ACID"

→ Decision Tracker Agent se activa:

Entity creada:
- decision: "Use PostgreSQL as primary database"
  Observations:
  - Choice: "PostgreSQL"
  - Alternatives considered: "MongoDB, MySQL"
  - Reasons:
    * Require ACID transactions
    * Strong consistency needed
    * Relational data model fits use case
  - Trade-offs:
    * Less flexible schema than MongoDB
    * More complex setup than SQLite
  - Context: "E-commerce platform with orders/payments"
  Confidence: 0.9
  Tags: ["database", "architecture", "postgresql"]

Relation creada:
- decision → applies to → component "Order Management System"
```

**Resultado:**
Futuras conversaciones no re-discuten "¿qué base de datos usar?". Claude sabe la decisión y sus razones.

---

### 6. 🎨 Style Preferences Agent

**Archivo:** `.claude/agents/style-preferences.md`

**Trigger:**
- Después de escribir código
- Usuario da feedback sobre estilo
- Usuario acepta/rechaza approach de implementación
- Patrón emerge de múltiples interacciones

**Propósito:**
Aprender estilo de código del usuario, patrones arquitectónicos, y preferencias técnicas.

**Tipos de Entidades Creadas:**
- `style-rule` - Regla de estilo de código
- `architectural-pattern` - Patrón arquitectónico preferido
- `tool-preference` - Preferencia de herramientas/libraries

**Aprendizaje:**
- **Explícito:** Usuario dice "prefiero X"
- **Por repetición:** Patrón aparece 3+ veces
- **Por feedback:** Usuario acepta/rechaza implementación

**Sistema de Confianza:**
- 1.0 = Explícito ("quiero que uses X")
- 0.8 = Patrón claro (usado 3+ veces)
- 0.5 = Inferido (usado 1-2 veces)

**Ejemplo de Uso:**

```
Claude implementa:
const config = {
  port: 3000,
  host: 'localhost'
}

Usuario: "Prefiero usar variables de entorno con dotenv"

→ Style Preferences Agent se activa:

Entities creadas:
1. style-rule: "Use environment variables for configuration"
   Observations:
   - Pattern: "Load config from process.env"
   - Tools: "Use dotenv package"
   - Avoid: "Hardcoded config values"
   Confidence: 1.0 (explícito)

2. tool-preference: "Prefer dotenv for env management"
   Confidence: 1.0

---

Después de 3 PRs usando Jest:

→ Style Preferences Agent detecta patrón:

Entity creada:
- tool-preference: "Use Jest for testing"
  Observations:
  - Used in 3 different components
  - Consistent test structure
  Confidence: 0.8 (patrón claro)
```

**Resultado:**
Claude escribe código en TU estilo, usa TUS herramientas preferidas, sigue TUS patrones.

---

### 7. 💾 Session Context Agent

**Archivo:** `.claude/agents/session-context.md`

**Trigger:**
- Usuario dice "continue later" o similar
- Trabajo parcialmente completo
- Breakpoints naturales en trabajo complejo
- Blocker encontrado que requiere input del usuario

**Propósito:**
Preservar contexto de trabajo entre sesiones. Permitir retomar exactamente donde se dejó.

**Tipos de Entidades Creadas:**
- `session-snapshot` - Estado completo de la sesión
- `continuation-point` - Punto específico de continuación
- `work-in-progress` - Tareas incompletas

**Información Capturada:**
- Trabajo completado hasta ahora
- Trabajo pendiente
- Decisiones tomadas en esta sesión
- Blockers encontrados
- Next immediate step

**Ejemplo de Uso:**

```
Usuario: "Tengo que salir, continuamos mañana"

→ Session Context Agent se activa:

Entity creada:
- session-snapshot: "Auth implementation - 2025-10-07"
  Observations:

  COMPLETED:
  - ✅ JWT token generation implemented
  - ✅ Login endpoint created
  - ✅ Password hashing with bcrypt

  PENDING:
  - ⏳ Implement refresh token logic
  - ⏳ Add token expiration handling
  - ⏳ Write tests for auth flow

  DECISIONS:
  - Use JWT with 7-day expiration
  - Use bcrypt for passwords

  NEXT STEP:
  - Implement refresh token endpoint in auth.controller.js

  FILES MODIFIED:
  - src/controllers/auth.controller.js (lines 1-45)
  - src/services/token.service.js (complete file)

  Confidence: 1.0
  Tags: ["session", "auth", "in-progress"]

---

Mañana, usuario abre nueva conversación:

Usuario: "Continuemos con la autenticación"

→ Context Recovery Agent busca sessions recientes
→ Encuentra snapshot de ayer
→ Carga contexto completo
→ Claude continúa desde "NEXT STEP" sin re-explicar nada
```

**Resultado:**
Zero pérdida de progreso. Interrupciones no cuestan nada.

---

### 8. 🚨 Pre-Compact Interceptor Agent

**Archivo:** `.claude/agents/pre-compact-interceptor.md`

**Trigger:**
- Token usage > 160k (80% de 200k)
- Message count > 40 intercambios
- Antes de operaciones grandes que excederán 160k
- Usuario ejecuta `/checkpoint` manualmente

**Propósito:**
Guardar estado completo **ANTES** de que autocompact de Claude elimine información.

**Tipos de Entidades Creadas:**
- `session-snapshot` (tipo especial: checkpoint)

**Workflow:**
1. **Detecta** umbral de contexto
2. **Alerta** usuario: "🚨 Context checkpoint triggered"
3. **Captura** estado exhaustivo
4. **Genera** continuation summary
5. **Instruye** usuario: copiar summary a nueva conversación

**Información Capturada:**

```
METADATA:
- Timestamp
- Token count (ej: 165k/200k)
- Message count
- Reason (auto/manual)

CURRENT WORK:
- Task being worked on
- Progress made
- Current file/line

COMPLETED:
- All finished tasks this session
- Files modified
- Decisions made
- Solutions found

PENDING:
- Next immediate step
- Remaining tasks
- Blockers

KEY CONTEXT:
- Important decisions + reasoning
- Approaches tried (successful/failed)
- User preferences discovered
- Critical information to remember

RESUME INSTRUCTIONS:
- Exactly what to do next
- Which files to continue in
- What context is essential
```

**Ejemplo de Uso:**

```
(Conversación larga, 170k tokens usados)

→ Pre-Compact Interceptor Agent se activa automáticamente:

Claude:
"🚨 Context checkpoint triggered (170k/200k tokens)

Guardando estado completo en memoria...

✅ Checkpoint saved: session-checkpoint-2025-10-07-15-30

📋 CONTINUATION SUMMARY
═══════════════════════════════════════════════════════

Por favor, copia este resumen y pégalo en una NUEVA conversación:

---
Checkpoint ID: session-checkpoint-2025-10-07-15-30
Timestamp: 2025-10-07 15:30:00

TRABAJANDO EN:
Implementación completa de sistema de autenticación multi-factor (MFA)

COMPLETADO:
✅ JWT authentication (login/logout)
✅ Refresh token rotation
✅ Password reset flow
✅ Email verification
✅ TOTP 2FA implementation
✅ Tests: 45 passing

PENDIENTE:
⏳ SMS 2FA integration (Twilio)
⏳ Backup codes generation
⏳ Admin panel for user management

NEXT STEP:
Implementar SMS 2FA en src/services/mfa.service.js línea 67
Usar Twilio API (credentials en .env.example)

DECISIONES CLAVE:
- TOTP library: speakeasy (más seguro que otplib)
- SMS provider: Twilio (mejor deliverability)
- Token expiration: 7 días (user preference)

FILES IN PROGRESS:
- src/services/mfa.service.js (línea 67 - incomplete)
---

Para continuar: Pega este resumen en nueva conversación y di "continuar desde checkpoint"
```

**Resultado:**
- 100% información preservada
- Continuación perfecta en nueva conversación
- Claude controla contexto, no autocompact

---

### 9. 💡 Context Recovery Agent

**Archivo:** `.claude/agents/context-recovery.md`

**Trigger:**
- Nueva conversación con keywords de continuación
- Usuario pega continuation summary
- **Proactivamente al iniciar CUALQUIER conversación** (verifica checkpoints recientes)
- Usuario dice "continuar desde donde dejamos"

**Propósito:**
Recuperar estado completo desde checkpoints. Permitir continuación seamless.

**Detección de Triggers:**

```
Pattern 1: Formatted continuation summary
- Detecta "Checkpoint ID:"
- Extrae ID y busca en memoria

Pattern 2: Natural language
- Usuario: "continuar con autenticación"
- Busca checkpoints recientes sobre "autenticación"

Pattern 3: Proactive discovery
- SIEMPRE verifica checkpoints < 24h
- Si encuentra checkpoint in-progress, pregunta
```

**Workflow:**

1. **Busca** checkpoints recientes (< 24 horas, status: in-progress/paused)
2. **Carga** contexto completo
3. **Presenta** resumen al usuario
4. **Aplica** todo el contexto automáticamente
5. **Actualiza** status del checkpoint (resumed/completed)

**Ejemplo de Uso:**

```
Nueva conversación:

Usuario: "continuar desde checkpoint"

→ Context Recovery Agent se activa:

Busca en memoria:
- Tipo: session-snapshot
- Status: in-progress
- Created: < 24h ago

Encuentra:
✅ session-checkpoint-2025-10-07-15-30

Carga y presenta:

Claude:
"💡 Checkpoint encontrado y recuperado:

📋 RESUMEN DE CONTEXTO CARGADO
═══════════════════════════════════════

Trabajando en: Autenticación MFA
Última actualización: Hace 2 horas

Completado:
✅ JWT auth, refresh tokens, TOTP 2FA, tests

Pendiente:
⏳ SMS 2FA (Twilio)
⏳ Backup codes
⏳ Admin panel

Next step:
→ Implementar SMS 2FA en src/services/mfa.service.js:67

Decisiones recordadas:
- TOTP: speakeasy
- SMS: Twilio
- Expiration: 7 días

¿Continuamos con SMS 2FA integration?"

→ Usuario: "sí"
→ Claude continúa exactamente desde línea 67
→ Zero re-explicación, zero pérdida de contexto
```

**Resultado:**
- Conversaciones interrumpidas se retoman perfectamente
- No re-explicar nada
- Contexto infinito mediante checkpoints

---

### 10. 🎯 Confidence Evaluator Agent

**Archivo:** `.claude/agents/confidence-evaluator.md`

**Trigger:**
- Después de aplicar conocimiento (verificar si funcionó)
- Inicio de sesión (health check periódico)
- Contradicción detectada entre conocimientos

**Propósito:**
Mantener calidad del knowledge base. Ajustar confidence scores basado en resultados.

**Acciones:**

**1. Después de aplicar conocimiento:**
```
Pattern Recognition encontró solución previa
Claude la aplicó
¿Funcionó?

SI → Increment confidence (+0.1, max 1.0)
NO → Decrement confidence (-0.2, min 0.0)
      Marcar para revisión
```

**2. Health check periódico:**
```
Buscar knowledge con:
- Low confidence (<0.5) + no usado en >30 días → Sugerir eliminar
- Unverified + usado 3+ veces → Sugerir verificar
- Contradictory relationships → Alertar
```

**3. Al detectar contradicción:**
```
Dos decisiones contradictorias encontradas:
- Decision A: "Use PostgreSQL" (confidence: 0.9)
- Decision B: "Use MongoDB" (confidence: 0.7)

Acción:
- Alertar usuario
- Solicitar aclaración
- Deprecate la de menor confidence
```

**Ejemplo de Uso:**

```
Sesión 1:
Error: "bcrypt install failed"
Solution: "Install build-essential"
Confidence: 0.8 (no verificado aún)

---

Sesión 2:
Mismo error ocurre
Pattern Recognition sugiere: "Install build-essential"
Claude lo aplica
✅ Funciona!

→ Confidence Evaluator se activa:

Acción:
- Increment confidence: 0.8 → 0.9
- Mark as verified: true
- Update lastUsed: 2025-10-07
- Increment usageCount: 1 → 2

---

Sesión 50 (3 meses después):
Confidence Evaluator health check

Encuentra:
- Solution "Install build-essential"
  Confidence: 0.99
  Used: 15 times
  Last used: Yesterday

  Acción: Keep (high confidence, high usage)

- Decision "Use Redis for cache"
  Confidence: 0.5
  Used: 0 times
  Last used: 90 days ago

  Acción: Flag for review "Unused low-confidence knowledge"
```

**Resultado:**
- Knowledge base auto-limpia
- Confidence refleja realidad
- Contradicciones detectadas automáticamente

---

## Workflow de Interacción

### Ejemplo Completo: De Request a Conocimiento Persistente

```
1. 💬 Usuario: "Add logging to the API"

   → User Intent Capture
   Captura: intent "Add logging", preference "structured logging"

2. 🔍 Pattern Recognition (ANTES de empezar)

   Busca: "logging", "API"

   Encuentra:
   ✅ Decision: "Use Winston for logging" (confidence: 0.9)
   ✅ Style rule: "Log format: JSON structured"
   ✅ User preference: "Include request IDs"

   Claude aplica conocimiento previo directamente

3. 🛠️ Claude implementa usando Winston + JSON + request IDs

4. ❌ Error: "Module 'winston' not found"

   → Error Detection
   Captura error completo

5. ✅ Claude: npm install winston
   Funciona!

   → Solution Capture
   Captura solución, vincula a error

6. 📋 Claude: "¿Log level en production?"
   Usuario: "Info level, debug solo en dev"

   → Decision Tracker
   Captura decisión + reasoning

7. 🎨 Claude escribe código con cierto estilo

   → Style Preferences
   Aprende: preferencia por async/await sobre callbacks

8. 💾 Usuario: "Tengo que irme"

   → Session Context
   Guarda: logging implementado, pending: tests

9. 🚨 (Si contexto > 160k tokens)

   → Pre-Compact Interceptor
   Checkpoint automático

10. 💡 (Nueva conversación al día siguiente)

    → Context Recovery
    Carga contexto: "Logging done, need tests"

11. ✅ Tests escritos y pasan

    → Confidence Evaluator
    Incrementa confidence de decisión "Winston"
```

**Todo es automático. Usuario solo programa.**

---

## Crear Agentes Personalizados

### Estructura de un Agente

Crea archivo `.claude/agents/mi-agente.md`:

```markdown
---
name: mi-agente
description: Breve descripción
approved:
  - "mcp__memory__*"
  - "TodoWrite"
---

# Mi Agente Personalizado

## Propósito
Explicación de qué hace este agente

## Triggers
Cuándo debe activarse

## Tareas
1. Buscar conocimiento relevante
2. Crear entidades apropiadas
3. Establecer relaciones
4. Reportar hallazgos

## Prompt para Activación

Eres el agente [NOMBRE]. Tu misión es [PROPÓSITO].

### Contexto
{contexto que Claude provee}

### Acciones a Realizar
1. Busca en memoria usando mcp__memory__search_nodes
2. Analiza si [CONDICIÓN]
3. Crea entities usando mcp__memory__create_entities
4. Reporta: [QUÉ REPORTAR]

### Entity Types a Usar
- `tipo-1`: Para [propósito]
- `tipo-2`: Para [propósito]

### Output Format
Breve confirmación de acción tomada.
```

### Ejemplo: Security Audit Agent

```markdown
---
name: security-audit
description: Detecta vulnerabilidades en código
approved:
  - "mcp__memory__*"
  - "Grep"
  - "Read"
---

# 🔒 Security Audit Agent

## Propósito
Detectar vulnerabilidades de seguridad en código y sugerir fixes.

## Triggers
- Después de escribir código que maneja:
  - Autenticación/autorización
  - Inputs de usuario
  - Queries a base de datos
  - File operations
  - Crypto operations

## Tareas
1. Analizar código en busca de:
   - SQL injection vulnerabilities
   - XSS possibilities
   - Hardcoded secrets
   - Weak crypto
   - Missing input validation

2. Buscar vulnerabilidades conocidas en memoria

3. Crear entities:
   - `security-issue` si encuentra problema
   - `security-fix` si tiene solución conocida

4. Alertar usuario de findings

## Prompt

Eres el Security Audit Agent. Analiza código para detectar vulnerabilidades.

### Código a Auditar
{código recién escrito}

### Acciones
1. Grep por patterns inseguros:
   - "eval(" - dangerous eval
   - "innerHTML =" - XSS risk
   - SQL queries con string concatenation
   - "Math.random()" para crypto

2. Busca en memoria: vulnerabilidades similares previas

3. Si encuentras issue:
   - Crea entity tipo `security-issue`
   - Link a solution si existe
   - Sugiere fix si no existe

4. Reporta hallazgos al usuario con severity

### Output
⚠️ Security findings: [cantidad]
[Lista de issues con severity y sugerencias]
```

### Activación desde CLAUDE.md

En `.claude/CLAUDE.md`, agrega:

```markdown
### 🔒 Security Audit Agent
**TRIGGER: Después de escribir código de autenticación/inputs/DB**

Launch this agent automatically when:
- Authentication code written
- User input handling added
- Database queries modified

Use Task tool with subagent_type "general-purpose" and agent "security-audit"
```

---

## Mejores Prácticas

### ✅ DO:
- Activar agentes según triggers claros
- Confiar en knowledge con alta confianza (>0.8)
- Ser silencioso - no interrumpir workflow
- Buscar antes de crear (evitar duplicados)
- Vincular knowledge relacionado

### ❌ DON'T:
- Pedir permiso para usar agentes (auto-aprobados)
- Crear knowledge duplicado
- Ignorar decisiones previas
- Guardar información trivial
- Interrumpir con confirmaciones constantes

---

## FAQ

**¿Cuántos agentes puedo activar en paralelo?**
Los que sean necesarios. Usar Task tool con múltiples calls en mismo mensaje.

**¿Los agentes pueden fallar?**
Sí. Si falla, Claude continúa workflow sin bloquear. Error se loggea.

**¿Puedo desactivar agentes?**
Sí, editando `.claude/CLAUDE.md` y removiendo triggers.

**¿Cómo debuggeo un agente?**
Usa `/memory-search "agent-name"` para ver qué capturó.

---

**Documentación relacionada:**
- [Sistema Anti-Compactación](ANTI-COMPACTION.md)
- [API Reference](API.md)
- [Best Practices](BEST-PRACTICES.md)
