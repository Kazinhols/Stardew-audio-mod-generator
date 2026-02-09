#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  🌾 Stardew Audio Mod Generator - Build CachyOS     ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Verificar se estamos na pasta correta
if [ ! -f "package.json" ] || [ ! -d "src-tauri" ]; then
    echo "❌ Execute este script na raiz do projeto!"
    echo "   cd /caminho/para/stardew-audio-mod-generator"
    echo "   ./scripts/build-cachyos.sh"
    exit 1
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; }
info() { echo -e "${BLUE}[i]${NC} $1"; }

# ==================== 1. CHECK & INSTALL RUST ====================
echo "━━━ 1/6 Verificando Rust ━━━"
if command -v rustc &>/dev/null; then
    RUST_VER=$(rustc --version)
    log "Rust instalado: $RUST_VER"
else
    warn "Rust não encontrado. Instalando via pacman..."
    sudo pacman -S --needed --noconfirm rustup
    rustup default stable
    source "$HOME/.cargo/env" 2>/dev/null || true
    log "Rust instalado: $(rustc --version)"
fi

# ==================== 2. SYSTEM DEPENDENCIES ====================
echo ""
echo "━━━ 2/6 Instalando dependências do sistema ━━━"

PACKAGES=(
    # Build essentials
    base-devel
    gcc
    pkg-config
    # Tauri dependencies
    webkit2gtk-4.1
    gtk3
    libappindicator-gtk3
    librsvg
    openssl
    patchelf
    # Image tools (for icon generation)
    imagemagick
)

info "Instalando pacotes: ${PACKAGES[*]}"
sudo pacman -S --needed --noconfirm "${PACKAGES[@]}" 2>/dev/null || {
    warn "Alguns pacotes podem já estar instalados"
}
log "Dependências do sistema OK"

# ==================== 3. NODE.JS ====================
echo ""
echo "━━━ 3/6 Verificando Node.js ━━━"
if command -v node &>/dev/null; then
    log "Node.js: $(node --version)"
else
    warn "Node.js não encontrado. Instalando..."
    sudo pacman -S --needed --noconfirm nodejs npm
    log "Node.js instalado: $(node --version)"
fi

# ==================== 4. NPM DEPENDENCIES ====================
echo ""
echo "━━━ 4/6 Instalando dependências npm ━━━"
npm install 2>&1 | tail -1
if ! npx tauri --version &>/dev/null 2>&1; then
    info "Instalando @tauri-apps/cli..."
    npm install -D @tauri-apps/cli @tauri-apps/api 2>&1 | tail -1
fi
log "Dependências npm OK"

# ==================== 5. GENERATE ICONS ====================
echo ""
echo "━━━ 5/6 Gerando ícones ━━━"

ICONS_DIR="src-tauri/icons"
mkdir -p "$ICONS_DIR"

# Check if icons already exist
if [ -f "$ICONS_DIR/128x128.png" ] && [ -f "$ICONS_DIR/icon.ico" ]; then
    log "Ícones já existem"
else
    info "Gerando ícones PNG a partir do SVG..."

    if [ -f "$ICONS_DIR/icon.svg" ]; then
        SVG_SOURCE="$ICONS_DIR/icon.svg"
    else
        # Create a simple SVG icon
        SVG_SOURCE="$ICONS_DIR/icon.svg"
        cat > "$SVG_SOURCE" << 'SVGEOF'
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6bc048"/>
      <stop offset="100%" stop-color="#3d8020"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="64" fill="url(#bg)"/>
  <text x="256" y="200" text-anchor="middle" font-size="120" fill="white">🎵</text>
  <text x="256" y="340" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="60" fill="white">SDV</text>
  <text x="256" y="410" text-anchor="middle" font-family="sans-serif" font-size="40" fill="rgba(255,255,255,0.8)">AUDIO</text>
</svg>
SVGEOF
        log "SVG criado"
    fi

    if command -v magick &>/dev/null; then
        CONVERT_CMD="magick"
    elif command -v convert &>/dev/null; then
        CONVERT_CMD="convert"
    else
        err "ImageMagick não encontrado! Instalando..."
        sudo pacman -S --needed --noconfirm imagemagick
        CONVERT_CMD="magick"
    fi

    # Generate all required sizes
    $CONVERT_CMD "$SVG_SOURCE" -resize 32x32     "$ICONS_DIR/32x32.png"        2>/dev/null && log "32x32.png" || warn "32x32.png falhou"
    $CONVERT_CMD "$SVG_SOURCE" -resize 128x128   "$ICONS_DIR/128x128.png"      2>/dev/null && log "128x128.png" || warn "128x128.png falhou"
    $CONVERT_CMD "$SVG_SOURCE" -resize 256x256   "$ICONS_DIR/128x128@2x.png"   2>/dev/null && log "128x128@2x.png" || warn "128x128@2x.png falhou"
    $CONVERT_CMD "$SVG_SOURCE" -resize 512x512   "$ICONS_DIR/icon.png"         2>/dev/null && log "icon.png" || warn "icon.png falhou"

    # ICO for Windows
    $CONVERT_CMD "$SVG_SOURCE" -resize 256x256 "$ICONS_DIR/icon.ico" 2>/dev/null && log "icon.ico" || {
        # Fallback: copy png as ico
        cp "$ICONS_DIR/128x128@2x.png" "$ICONS_DIR/icon.ico" 2>/dev/null
        warn "icon.ico (fallback)"
    }

    # ICNS for macOS (not critical on Linux)
    cp "$ICONS_DIR/icon.png" "$ICONS_DIR/icon.icns" 2>/dev/null || true

    log "Ícones gerados"
fi

# ==================== 6. BUILD ====================
echo ""
echo "━━━ 6/6 Compilando aplicação ━━━"
info "Isso pode levar alguns minutos na primeira vez..."
echo ""

npx tauri build 2>&1

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ BUILD COMPLETO!                                  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Show generated files
BUNDLE_DIR="src-tauri/target/release/bundle"

if [ -d "$BUNDLE_DIR/appimage" ]; then
    echo -e "${GREEN}📦 AppImage:${NC}"
    ls -lh "$BUNDLE_DIR/appimage/"*.AppImage 2>/dev/null || echo "  (não encontrado)"
    echo ""
fi

if [ -d "$BUNDLE_DIR/deb" ]; then
    echo -e "${GREEN}📦 DEB:${NC}"
    ls -lh "$BUNDLE_DIR/deb/"*.deb 2>/dev/null || echo "  (não encontrado)"
    echo ""
fi

if [ -d "$BUNDLE_DIR/rpm" ]; then
    echo -e "${GREEN}📦 RPM:${NC}"
    ls -lh "$BUNDLE_DIR/rpm/"*.rpm 2>/dev/null || echo "  (não encontrado)"
    echo ""
fi

# Find AppImage and offer to run
APPIMAGE=$(find "$BUNDLE_DIR/appimage" -name "*.AppImage" 2>/dev/null | head -1)
if [ -n "$APPIMAGE" ]; then
    chmod +x "$APPIMAGE"
    echo ""
    read -p "🚀 Deseja executar agora? (s/n): " CHOICE
    if [ "$CHOICE" = "s" ] || [ "$CHOICE" = "S" ] || [ "$CHOICE" = "y" ]; then
        "$APPIMAGE" &
        log "Aplicação iniciada!"
    fi
fi
