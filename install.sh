#!/bin/bash

# Script de instalación para Self-Improving Memory MCP

set -e

echo "🧠 Self-Improving Memory MCP - Instalación"
echo "=========================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Detectar OS
OS="unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    CONFIG_PATH="$HOME/.config/Claude/claude_desktop_config.json"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
    CONFIG_PATH="$APPDATA/Claude/claude_desktop_config.json"
fi

echo -e "${BLUE}Sistema detectado: $OS${NC}"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js no encontrado${NC}"
    echo "  Instala Node.js desde: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js $NODE_VERSION${NC}"

# Directorio de instalación
INSTALL_DIR="$HOME/self-improving-memory"

echo ""
echo -e "${YELLOW}Directorio de instalación:${NC} $INSTALL_DIR"
echo ""

# Preguntar si continuar
read -p "¿Continuar con la instalación? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Instalación cancelada."
    exit 1
fi

# Crear directorio
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo ""
echo -e "${BLUE}Descargando archivos...${NC}"

# Aquí deberías tener los archivos descargados o copiarlos manualmente
# Por ahora solo verificamos si existen

if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}⚠ package.json no encontrado${NC}"
    echo "  Copia manualmente los archivos al directorio:"
    echo "  - package.json"
    echo "  - index.js"
    echo "  - memory-cli.js"
    exit 1
fi

echo -e "${GREEN}✓ Archivos encontrados${NC}"

# Instalar dependencias
echo ""
echo -e "${BLUE}Instalando dependencias...${NC}"
npm install

# Hacer CLI ejecutable
chmod +x memory-cli.js

# Link global
echo ""
echo -e "${BLUE}Instalando CLI globalmente...${NC}"
npm link

echo -e "${GREEN}✓ CLI instalado${NC}"

# Preguntar por directorio del proyecto
echo ""
echo -e "${YELLOW}Configuración de Claude Desktop${NC}"
echo ""
read -p "Ruta absoluta de tu proyecto: " PROJECT_PATH

if [ ! -d "$PROJECT_PATH" ]; then
    echo -e "${RED}✗ Directorio no existe: $PROJECT_PATH${NC}"
    exit 1
fi

# Crear/actualizar configuración de Claude
echo ""
echo -e "${BLUE}Configurando Claude Desktop...${NC}"

# Crear directorio de config si no existe
mkdir -p "$(dirname "$CONFIG_PATH")"

# Leer config existente o crear nuevo
if [ -f "$CONFIG_PATH" ]; then
    echo -e "${YELLOW}⚠ Configuración existente encontrada${NC}"
    echo "  Se actualizará con el servidor de memoria"
    
    # Backup
    cp "$CONFIG_PATH" "$CONFIG_PATH.backup"
    echo -e "${GREEN}✓ Backup creado: $CONFIG_PATH.backup${NC}"
else
    echo "{}" > "$CONFIG_PATH"
fi

# Añadir configuración del servidor
# (Esto es una versión simplificada - en producción usarías jq o similar)
cat > "$CONFIG_PATH" << EOF
{
  "mcpServers": {
    "memory": {
      "command": "node",
      "args": ["$INSTALL_DIR/index.js"],
      "env": {
        "PROJECT_PATH": "$PROJECT_PATH"
      }
    }
  }
}
EOF

echo -e "${GREEN}✓ Configuración actualizada${NC}"

# Inicializar proyecto
echo ""
echo -e "${BLUE}Inicializando memoria en el proyecto...${NC}"
cd "$PROJECT_PATH"
memory-cli init

echo ""
echo -e "${GREEN}=========================================="
echo "✓ ¡Instalación completada!"
echo "==========================================${NC}"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo ""
echo "1. Reinicia Claude Desktop completamente"
echo "2. Abre Claude y verifica que vea las herramientas:"
echo "   'Claude, ¿puedes ver las herramientas de memoria?'"
echo ""
echo "3. Prueba el CLI:"
echo "   cd $PROJECT_PATH"
echo "   memory-cli stats"
echo ""
echo -e "${BLUE}Documentación:${NC}"
echo "  README: $INSTALL_DIR/README.md"
echo "  Config: $CONFIG_PATH"
echo ""
echo -e "${GREEN}¡Listo para usar! 🎉${NC}"
echo ""