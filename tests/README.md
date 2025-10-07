# 🧪 Tests - Self-Improving Memory

Suite de tests para el proyecto.

---

## 📁 Estructura

```
tests/
├── unit/                      # Tests unitarios
│   └── (próximamente)
├── integration/               # Tests de integración
│   ├── test-mcp.js           # Test del servidor MCP
│   └── test-save-plan.js     # Test de guardado de planes
├── fixtures/                  # Datos de prueba
│   └── (próximamente)
└── README.md                  # Este archivo
```

---

## 🚀 Cómo Ejecutar

### Tests de Integración

```bash
# Desde la raíz del proyecto
node tests/integration/test-mcp.js
node tests/integration/test-save-plan.js

# O desde el directorio de tests
cd tests/integration
node test-mcp.js
```

### Todos los Tests

```bash
# (Próximamente: test runner)
npm test
```

---

## 📋 Tests Actuales

### Integration Tests

#### `test-mcp.js`
- ✅ Iniciar servidor MCP
- ✅ Guardar conocimiento (save_knowledge)
- ✅ Buscar conocimiento (search_knowledge)
- ✅ Obtener estadísticas (get_stats)

#### `test-save-plan.js`
- ✅ Guardar plan de roadmap en memoria
- ✅ Verificar guardado con tags apropiados

---

## 📝 Tests Pendientes

### Unit Tests (Próximamente)
- [ ] KnowledgeStore.addEntry()
- [ ] KnowledgeStore.search()
- [ ] KnowledgeStore.linkEntries()
- [ ] KnowledgeStore.exportMarkdown()
- [ ] KnowledgeStore.getStats()

### Integration Tests (Expandir)
- [x] MCP tools básicos
- [ ] Error handling
- [ ] Edge cases
- [ ] Performance tests

### CLI Tests (Próximamente)
- [ ] memory-cli init
- [ ] memory-cli stats
- [ ] memory-cli list
- [ ] memory-cli search
- [ ] memory-cli export

---

## 🎯 Convenciones

- Usar nombres descriptivos: `test-<feature>.js`
- Cada test debe ser independiente
- Limpiar estado después de tests
- Usar emojis para output: ✅ ❌ 🧪

---

**Última actualización:** 2025-10-06
