# 🚀 Instalación Sin NPM (Desde GitHub)

Guía para instalar el sistema de memoria **directamente desde GitHub**, sin necesidad de que esté publicado en NPM.

---

## Método 1: NPX desde GitHub (Más Fácil)

```bash
# Instalar directamente desde el repositorio de GitHub
npx github:SuperPiTT/self-improving-memory-mcp memory-install

# O si el repo tiene otro nombre:
npx github:TU-USERNAME/REPO-NAME memory-install
```

**Ventajas:**
- ✅ No necesita clonar el repo
- ✅ Siempre usa la última versión
- ✅ Un solo comando

---

## Método 2: Git Clone + Link Global

```bash
# 1. Clonar el repositorio
git clone https://github.com/SuperPiTT/self-improving-memory-mcp.git
cd self-improving-memory-mcp

# 2. Instalar dependencias
npm install

# 3. Link globalmente (hace que 'memory-install' esté disponible en todo el sistema)
npm link

# 4. Ir a tu proyecto y ejecutar el installer
cd /path/to/your/project
memory-install

# 5. Reiniciar Claude Desktop
```

**Ventajas:**
- ✅ Tienes el código fuente local
- ✅ Puedes modificarlo si quieres
- ✅ Funciona sin NPM registry

---

## Método 3: Manual (Sin Scripts)

Si los scripts no funcionan, puedes configurar manualmente:

### Paso 1: Clonar y preparar

```bash
git clone https://github.com/SuperPiTT/self-improving-memory-mcp.git
cd self-improving-memory-mcp
npm install
```

### Paso 2: Copiar archivos a tu proyecto

```bash
# Ir a tu proyecto
cd /path/to/your/project

# Crear directorio .claude
mkdir -p .claude/agents

# Copiar archivos de agentes
cp -r /path/to/self-improving-memory-mcp/.claude/agents/* .claude/agents/
cp /path/to/self-improving-memory-mcp/.claude/CLAUDE.md .claude/
```

### Paso 3: Configurar Claude Desktop

Edita manualmente el archivo de configuración de Claude Desktop:

**macOS:**
```bash
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Linux:**
```bash
nano ~/.config/Claude/claude_desktop_config.json
```

**Windows:**
```powershell
notepad %APPDATA%\Claude\claude_desktop_config.json
```

**Agregar esta configuración:**

```json
{
  "mcpServers": {
    "memory": {
      "command": "node",
      "args": ["/RUTA/ABSOLUTA/A/self-improving-memory-mcp/index.js"],
      "env": {
        "PROJECT_PATH": "/RUTA/ABSOLUTA/A/TU/PROYECTO"
      }
    }
  }
}
```

**IMPORTANTE:** Reemplaza las rutas con las absolutas de tu sistema.

### Paso 4: Actualizar .gitignore

Agrega a tu `.gitignore`:

```
# Self-Improving Memory MCP
.claude-memory/
memory_data/
cache/
```

### Paso 5: Reiniciar Claude Desktop

Cierra **completamente** Claude Desktop y vuelve a abrirlo.

---

## Método 4: NPM Install desde GitHub

```bash
# Instalar directamente desde GitHub como dependencia
npm install -g git+https://github.com/SuperPiTT/self-improving-memory-mcp.git

# Luego ejecutar el installer
cd /path/to/your/project
memory-install
```

---

## Verificar Instalación

Después de cualquier método, verifica que funciona:

1. Abre Claude Desktop
2. Pregunta: **"Claude, ¿puedes ver las herramientas de memoria?"**
3. Deberías ver 18 MCP tools disponibles

---

## Actualizar a Nueva Versión

### Si usaste npm link:

```bash
cd /path/to/self-improving-memory-mcp
git pull origin main
npm install
# npm link ya está activo, no hace falta volver a hacer link
```

### Si usaste NPM install desde GitHub:

```bash
npm update -g @pytt0n/self-improving-memory-mcp
```

---

## Troubleshooting

### "command not found: memory-install"

Si usaste `git clone` pero no `npm link`, ejecuta:

```bash
cd /path/to/self-improving-memory-mcp
npm link
```

### "Module not found" al iniciar Claude

Verifica que la ruta en `claude_desktop_config.json` sea **absoluta** y **correcta**:

```bash
# Verificar que el archivo existe
ls /ruta/absoluta/a/self-improving-memory-mcp/index.js

# Verificar que Node.js puede ejecutarlo
node /ruta/absoluta/a/self-improving-memory-mcp/index.js
# Debería mostrar: "Self-Improving Memory MCP server running"
```

### Las herramientas no aparecen en Claude

1. Verifica que la configuración está bien:
   ```bash
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. **Cierra COMPLETAMENTE Claude Desktop** (Quit, no solo cerrar ventana)

3. Abre Claude Desktop de nuevo

4. Espera ~5 segundos para que carguen las herramientas

---

## Desinstalar

### Si usaste npm link:

```bash
# Desinstalar globalmente
npm unlink -g @pytt0n/self-improving-memory-mcp

# Limpiar el proyecto
cd /path/to/your/project
rm -rf .claude .claude-memory memory_data cache
```

### Limpiar configuración de Claude:

Edita `claude_desktop_config.json` y elimina la sección `"memory"`.

---

## ¿Cuándo estará en NPM?

Este proyecto estará disponible pronto en NPM como:

```bash
npm install -g @pytt0n/self-improving-memory-mcp
```

Mientras tanto, puedes usar cualquiera de los métodos anteriores.

---

## Ayuda

Si tienes problemas:

1. Lee [QUICK-INSTALL.md](QUICK-INSTALL.md)
2. Revisa [docs/INSTALLATION.md](docs/INSTALLATION.md)
3. Abre un issue: https://github.com/SuperPiTT/self-improving-memory-mcp/issues

---

**Happy coding! 🧠✨**
