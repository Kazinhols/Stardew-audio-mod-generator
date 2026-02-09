#!/bin/bash
# =====================================================
# 🎵 Stardew Audio Mod Generator - Build Linux
# Detecta automaticamente a distro e instala dependências
# =====================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════╗"
echo "║  🎵 Stardew Audio Mod Generator - Build      ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# ==================== DETECTAR DISTRO ====================
DISTRO="unknown"
PKG_MANAGER="unknown"

if [ -f /etc/os-release ]; then
    . /etc/os-release
    DISTRO_ID="$ID"
    DISTRO_LIKE="$ID_LIKE"
    DISTRO_NAME="$PRETTY_NAME"
else
    DISTRO_ID="unknown"
    DISTRO_LIKE=""
    DISTRO_NAME="Unknown Linux"
fi

echo -e "${CYAN}🐧 Distro detectada: ${GREEN}$DISTRO_NAME${NC}"

# Classificar a distro
if echo "$DISTRO_ID $DISTRO_LIKE" | grep -qi "arch"; then
    DISTRO="arch"
    PKG_MANAGER="pacman"
    echo -e "${CYAN}   Tipo: Arch Linux (pacman)${NC}"
    echo -e "${CYAN}   → Usando script otimizado para Arch/CachyOS${NC}"
elif echo "$DISTRO_ID $DISTRO_LIKE" | grep -qi "debian\|ubuntu\|mint\|pop"; then
    DISTRO="debian"
    PKG_MANAGER="apt"
    echo -e "${CYAN}   Tipo: Debian/Ubuntu (apt)${NC}"
elif echo "$DISTRO_ID $DISTRO_LIKE" | grep -qi "fedora\|rhel\|centos"; then
    DISTRO="fedora"
    PKG_MANAGER="dnf"
    echo -e "${CYAN}   Tipo: Fedora/RHEL (dnf)${NC}"
elif echo "$DISTRO_ID $DISTRO_LIKE" | grep -qi "opensuse\|suse"; then
    DISTRO="suse"
    PKG_MANAGER="zypper"
    echo -e "${CYAN}   Tipo: openSUSE (zypper)${NC}"
else
    echo -e "${YELLOW}⚠️  Distro não reconhecida. Tentando detectar pacman/apt/dnf...${NC}"
    if command -v pacman &> /dev/null; then
        DISTRO="arch"
        PKG_MANAGER="pacman"
    elif command -v apt &> /dev/null; then
        DISTRO="debian"
        PKG_MANAGER="apt"
    elif command -v dnf &> /dev/null; then
        DISTRO="fedora"
        PKG_MANAGER="dnf"
    fi
fi

echo ""

# ==================== RUST ====================
echo -e "${CYAN}[1/6] 🦀 Verificando Rust...${NC}"

if command -v rustc &> /dev/null; then
    echo -e "${GREEN}✅ Rust: $(rustc --version)${NC}"
else
    echo -e "${YELLOW}⚠️  Instalando Rust...${NC}"
    
    if [ "$DISTRO" = "arch" ]; then
        sudo pacman -S --needed --noconfirm rustup
        rustup default stable
    else
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    fi
    
    [ -f "$HOME/.cargo/env" ] && source "$HOME/.cargo/env"
    export PATH="$HOME/.cargo/bin:$PATH"
    
    if command -v rustc &> /dev/null; then
        echo -e "${GREEN}✅ Rust instalado: $(rustc --version)${NC}"
    else
        echo -e "${RED}❌ Falha. Reinicie o terminal e tente novamente.${NC}"
        exit 1
    fi
fi

echo ""

# ==================== DEPENDÊNCIAS DO SISTEMA ====================
echo -e "${CYAN}[2/6] 📦 Instalando dependências do sistema ($PKG_MANAGER)...${NC}"

case "$DISTRO" in
    arch)
        sudo pacman -S --needed --noconfirm \
            base-devel gcc pkg-config \
            webkit2gtk-4.1 gtk3 \
            libappindicator-gtk3 librsvg \
            openssl patchelf curl wget file
        ;;
    debian)
        sudo apt update
        sudo apt install -y \
            build-essential curl wget file \
            libssl-dev libwebkit2gtk-4.1-dev \
            libappindicator3-dev librsvg2-dev \
            patchelf libgtk-3-dev pkg-config
        ;;
    fedora)
        sudo dnf groupinstall -y "Development Tools"
        sudo dnf install -y \
            webkit2gtk4.1-devel \
            libappindicator-gtk3-devel \
            librsvg2-devel openssl-devel \
            gtk3-devel pkg-config
        ;;
    suse)
        sudo zypper install -y \
            -t pattern devel_basis \
            webkit2gtk3-devel \
            libappindicator3-devel \
            librsvg-devel libopenssl-devel \
            gtk3-devel pkg-config patchelf
        ;;
    *)
        echo -e "${RED}❌ Distro não suportada automaticamente.${NC}"
        echo "Instale manualmente: webkit2gtk-4.1, libappindicator3, librsvg, gtk3, patchelf"
        exit 1
        ;;
esac

echo -e "${GREEN}✅ Dependências instaladas${NC}"
echo ""

# ==================== NODE.JS ====================
echo -e "${CYAN}[3/6] 📗 Verificando Node.js...${NC}"

if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
else
    echo -e "${YELLOW}⚠️  Instalando Node.js...${NC}"
    case "$DISTRO" in
        arch)   sudo pacman -S --needed --noconfirm nodejs npm ;;
        debian) sudo apt install -y nodejs npm ;;
        fedora) sudo dnf install -y nodejs npm ;;
        suse)   sudo zypper install -y nodejs npm ;;
    esac
    
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✅ Node.js instalado: $(node --version)${NC}"
    else
        echo -e "${RED}❌ Falha. Instale manualmente via nvm.${NC}"
        exit 1
    fi
fi

echo ""

# ==================== NPM INSTALL ====================
echo -e "${CYAN}[4/6] 📦 Instalando dependências npm...${NC}"
npm install
echo -e "${GREEN}✅ npm install concluído${NC}"
echo ""

# ==================== TAURI CLI ====================
echo -e "${CYAN}[5/6] 🔧 Instalando Tauri CLI...${NC}"
npm install -D @tauri-apps/cli
echo -e "${GREEN}✅ Tauri CLI: $(npx tauri --version 2>/dev/null)${NC}"
echo ""

# ==================== ICONS ====================
echo -e "${CYAN}[6/7] 🖼️ Verificando ícones...${NC}"

ICONS_DIR="src-tauri/icons"
mkdir -p "$ICONS_DIR"

if [ ! -f "$ICONS_DIR/32x32.png" ]; then
    echo -e "${YELLOW}⚠️  Gerando ícones...${NC}"
    if command -v convert &> /dev/null && [ -f "$ICONS_DIR/icon.svg" ]; then
        convert "$ICONS_DIR/icon.svg" -resize 32x32 "$ICONS_DIR/32x32.png"
        convert "$ICONS_DIR/icon.svg" -resize 128x128 "$ICONS_DIR/128x128.png"
        convert "$ICONS_DIR/icon.svg" -resize 256x256 "$ICONS_DIR/128x128@2x.png"
        convert "$ICONS_DIR/icon.svg" -resize 256x256 "$ICONS_DIR/icon.png"
        convert "$ICONS_DIR/icon.svg" -resize 256x256 "$ICONS_DIR/icon.ico"
        cp "$ICONS_DIR/icon.png" "$ICONS_DIR/icon.icns"
        echo -e "${GREEN}✅ Ícones gerados${NC}"
    elif command -v rsvg-convert &> /dev/null && [ -f "$ICONS_DIR/icon.svg" ]; then
        rsvg-convert -w 32 -h 32 "$ICONS_DIR/icon.svg" > "$ICONS_DIR/32x32.png"
        rsvg-convert -w 128 -h 128 "$ICONS_DIR/icon.svg" > "$ICONS_DIR/128x128.png"
        rsvg-convert -w 256 -h 256 "$ICONS_DIR/icon.svg" > "$ICONS_DIR/128x128@2x.png"
        rsvg-convert -w 256 -h 256 "$ICONS_DIR/icon.svg" > "$ICONS_DIR/icon.png"
        cp "$ICONS_DIR/icon.png" "$ICONS_DIR/icon.ico"
        cp "$ICONS_DIR/icon.png" "$ICONS_DIR/icon.icns"
        echo -e "${GREEN}✅ Ícones gerados${NC}"
    else
        echo -e "${YELLOW}⚠️  Instale imagemagick para gerar ícones: sudo pacman -S imagemagick${NC}"
    fi
else
    echo -e "${GREEN}✅ Ícones OK${NC}"
fi
echo ""

# ==================== BUILD ====================
echo -e "${CYAN}[7/7] 🔨 Compilando...${NC}"
echo -e "${YELLOW}   ⏳ Primeira vez: ~5-10 min | Seguintes: ~30s${NC}"
echo ""

npx tauri build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro na compilação. Veja troubleshooting em BUILD_DESKTOP.md${NC}"
    exit 1
fi

# ==================== SUCESSO ====================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ BUILD CONCLUÍDO!                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""

BUNDLE="src-tauri/target/release/bundle"

for fmt in appimage deb rpm; do
    if ls "$BUNDLE/$fmt/"* 1> /dev/null 2>&1; then
        FILE=$(ls -1 "$BUNDLE/$fmt/"* | head -1)
        SIZE=$(du -h "$FILE" | cut -f1)
        echo -e "  ${GREEN}📦 $fmt: $FILE ($SIZE)${NC}"
    fi
done

echo ""
echo -e "${CYAN}Para executar (AppImage):${NC}"
echo "  chmod +x $BUNDLE/appimage/*.AppImage"
echo "  ./$BUNDLE/appimage/*.AppImage"
echo ""
