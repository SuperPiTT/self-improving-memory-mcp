# 📦 Guía para Publicar en NPM

Pasos detallados para publicar `@pytt0n/self-improving-memory-mcp` en NPM.

---

## 🎯 Pre-requisitos

Todo ya está listo:
- ✅ package.json configurado
- ✅ Tests pasando (263/263)
- ✅ Documentación completa
- ✅ Installer funcional
- ✅ .npmignore configurado
- ✅ Scripts de publicación

**Solo falta:** Crear cuenta NPM y publicar.

---

## 📝 Paso 1: Crear Cuenta en NPM

### Opción A: Desde el sitio web

1. Ve a https://www.npmjs.com/signup
2. Completa el formulario:
   - **Username:** (ej: `pytt0n` - será tu scope)
   - **Email:** Tu email
   - **Password:** Contraseña segura
3. Verifica tu email

### Opción B: Desde la terminal

```bash
npm adduser
# Te pedirá: username, password, email
# Sigue las instrucciones
```

---

## 🔑 Paso 2: Iniciar Sesión

```bash
npm login
```

Ingresa:
- Username
- Password
- Email
- OTP (si tienes 2FA habilitado)

Verificar que estás logueado:

```bash
npm whoami
# Debería mostrar tu username
```

---

## 🏷️ Paso 3: Ajustar el Scope en package.json

El scope **debe coincidir con tu username de NPM**.

Si tu username es `pytt0n`:
```json
{
  "name": "@pytt0n/self-improving-memory-mcp"
}
```

Si tu username es otro (ej: `johndoe`):
```json
{
  "name": "@johndoe/self-improving-memory-mcp"
}
```

**Editar:**

```bash
# Abrir package.json y cambiar el nombre si es necesario
nano package.json
```

O puedes usar un nombre sin scope (no recomendado):
```json
{
  "name": "self-improving-memory-mcp"
}
```

---

## ✅ Paso 4: Verificar que Todo Funciona

### 4.1 Ejecutar tests

```bash
npm test
```

Debe mostrar: **263 passing**

### 4.2 Verificar que el nombre está disponible

```bash
npm view @pytt0n/self-improving-memory-mcp
```

- Si dice **"npm ERR! 404"** → Nombre disponible ✅
- Si muestra info del package → Nombre ocupado, cambia el nombre ❌

### 4.3 Dry run (simular publicación)

```bash
npm publish --dry-run --access public
```

Debería mostrar qué archivos se van a publicar. Verifica que:
- ✅ Incluye: `index.js`, `src/`, `.claude/`, `bin/`, `docs/`
- ✅ Excluye: `tests/`, `node_modules/`, `.claude-memory/`

---

## 🚀 Paso 5: Publicar

### Opción A: Usando el script automático (recomendado)

```bash
chmod +x scripts/publish.sh
./scripts/publish.sh
```

El script:
1. Verifica que estás logueado
2. Revisa el estado de git
3. Ejecuta tests
4. Pregunta qué tipo de versión (patch/minor/major)
5. Hace dry-run
6. Pide confirmación
7. Publica a NPM
8. Crea git tag

### Opción B: Manual

```bash
# 1. Bump version (si es necesario)
npm version patch  # 2.0.0 → 2.0.1
# o
npm version minor  # 2.0.0 → 2.1.0
# o
npm version major  # 2.0.0 → 3.0.0

# 2. Publicar
npm publish --access public

# 3. Push git tags
git push --tags
```

---

## 🎉 Paso 6: Verificar Publicación

### Ver en NPM

Visita: https://www.npmjs.com/package/@pytt0n/self-improving-memory-mcp

Debería aparecer tu package con:
- Descripción
- README (automáticamente desde README.md o NPM-README.md)
- Versión
- Download stats

### Probar instalación

```bash
# En otra terminal/máquina
npm install -g @pytt0n/self-improving-memory-mcp

# Verificar que se instaló
memory-install --help
```

---

## 📊 Paso 7: Configurar GitHub (Opcional pero Recomendado)

### 7.1 Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Repository name: `self-improving-memory-mcp`
3. Description: "🧠 Self-improving memory system for Claude"
4. Public
5. Create repository

### 7.2 Subir código

```bash
git init
git add .
git commit -m "feat: Initial release v2.0.0"
git branch -M main
git remote add origin https://github.com/SuperPiTT/self-improving-memory-mcp.git
git push -u origin main
```

### 7.3 Crear release en GitHub

1. Ve a: https://github.com/SuperPiTT/self-improving-memory-mcp/releases/new
2. Tag: `v2.0.0`
3. Title: `v2.0.0 - Initial Release`
4. Description: Copy from PROGRESS.md or ROADMAP.md
5. Publish release

### 7.4 Agregar README badges

Edita README.md y agrega al inicio:

```markdown
[![npm version](https://badge.fury.io/js/@pytt0n%2Fself-improving-memory-mcp.svg)](https://www.npmjs.com/package/@pytt0n/self-improving-memory-mcp)
[![Downloads](https://img.shields.io/npm/dm/@pytt0n/self-improving-memory-mcp.svg)](https://www.npmjs.com/package/@pytt0n/self-improving-memory-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

---

## 🔄 Actualizar el Package (Futuras Versiones)

### Cuando hagas cambios:

```bash
# 1. Hacer cambios en el código
# 2. Actualizar tests
npm test

# 3. Commit
git add .
git commit -m "feat: nueva feature"

# 4. Bump version
npm version patch  # o minor/major

# 5. Publicar
npm publish

# 6. Push a GitHub
git push
git push --tags
```

---

## 📈 Monitorear el Package

### Ver estadísticas

- **NPM stats:** https://www.npmjs.com/package/@pytt0n/self-improving-memory-mcp
- **Download trends:** https://npm-stat.com/charts.html?package=@pytt0n/self-improving-memory-mcp

### Badges para README

```markdown
[![npm version](https://badge.fury.io/js/@pytt0n%2Fself-improving-memory-mcp.svg)](https://badge.fury.io/js/@pytt0n%2Fself-improving-memory-mcp)
[![Downloads](https://img.shields.io/npm/dt/@pytt0n/self-improving-memory-mcp.svg)](https://npmjs.com/package/@pytt0n/self-improving-memory-mcp)
[![GitHub stars](https://img.shields.io/github/stars/SuperPiTT/self-improving-memory-mcp.svg)](https://github.com/SuperPiTT/self-improving-memory-mcp/stargazers)
[![License](https://img.shields.io/npm/l/@pytt0n/self-improving-memory-mcp.svg)](https://github.com/SuperPiTT/self-improving-memory-mcp/blob/main/LICENSE)
```

---

## 🐛 Troubleshooting

### "You must be logged in to publish"

```bash
npm logout
npm login
```

### "You do not have permission to publish"

El scope debe coincidir con tu username, o usa un nombre sin scope.

### "Package name too similar to existing package"

Cambia el nombre en package.json a algo único.

### "402 Payment Required"

Packages con scope necesitan `--access public`:

```bash
npm publish --access public
```

---

## ✅ Checklist de Publicación

Antes de publicar, verifica:

- [ ] Tests pasando (263/263)
- [ ] Version correcta en package.json
- [ ] README.md actualizado
- [ ] CHANGELOG.md con cambios (si aplica)
- [ ] Scope correcto (@tu-username)
- [ ] Logueado en NPM (npm whoami)
- [ ] Git committed y pusheado
- [ ] Dry-run exitoso

---

## 🎊 ¡Felicidades!

Una vez publicado:

1. El package estará disponible en: `npm install -g @pytt0n/self-improving-memory-mcp`
2. Aparecerá en búsquedas de NPM
3. La gente podrá instalarlo fácilmente
4. Se actualizará automáticamente el README en npmjs.com

---

**¿Dudas?** Abre un issue o consulta la documentación de NPM: https://docs.npmjs.com/
