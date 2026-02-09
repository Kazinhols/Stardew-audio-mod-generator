#!/bin/bash
# Gera ícones placeholder para o Tauri build
# Requer: ImageMagick (convert) ou apenas cria PNGs mínimos

set -e

ICONS_DIR="src-tauri/icons"
mkdir -p "$ICONS_DIR"

echo "🖼️ Gerando ícones placeholder..."

# Check if ImageMagick is available
if command -v convert &> /dev/null; then
    echo "Usando ImageMagick..."
    
    # Generate from SVG if available
    if [ -f "$ICONS_DIR/icon.svg" ]; then
        convert "$ICONS_DIR/icon.svg" -resize 32x32 "$ICONS_DIR/32x32.png"
        convert "$ICONS_DIR/icon.svg" -resize 128x128 "$ICONS_DIR/128x128.png"
        convert "$ICONS_DIR/icon.svg" -resize 256x256 "$ICONS_DIR/128x128@2x.png"
        convert "$ICONS_DIR/icon.svg" -resize 256x256 "$ICONS_DIR/icon.png"
        convert "$ICONS_DIR/icon.svg" -resize 256x256 "$ICONS_DIR/icon.ico"
        convert "$ICONS_DIR/icon.svg" -resize 256x256 "$ICONS_DIR/icon.icns" 2>/dev/null || cp "$ICONS_DIR/icon.png" "$ICONS_DIR/icon.icns"
        echo "✅ Ícones gerados a partir do SVG"
    else
        # Generate simple colored squares
        convert -size 32x32 xc:"#e07020" "$ICONS_DIR/32x32.png"
        convert -size 128x128 xc:"#e07020" "$ICONS_DIR/128x128.png"
        convert -size 256x256 xc:"#e07020" "$ICONS_DIR/128x128@2x.png"
        convert -size 256x256 xc:"#e07020" "$ICONS_DIR/icon.png"
        convert -size 256x256 xc:"#e07020" "$ICONS_DIR/icon.ico"
        cp "$ICONS_DIR/icon.png" "$ICONS_DIR/icon.icns"
        echo "✅ Ícones placeholder gerados (quadrados laranja)"
    fi
elif command -v npx &> /dev/null; then
    echo "Tentando npx tauri icon..."
    if [ -f "$ICONS_DIR/icon.svg" ]; then
        # Try converting SVG to PNG first with rsvg-convert
        if command -v rsvg-convert &> /dev/null; then
            rsvg-convert -w 1024 -h 1024 "$ICONS_DIR/icon.svg" > "/tmp/icon_1024.png"
            npx tauri icon "/tmp/icon_1024.png" 2>/dev/null && echo "✅ Ícones gerados via tauri icon" || echo "⚠️ Falhou, tente instalar ImageMagick"
        else
            echo "⚠️ Instale imagemagick ou librsvg para gerar ícones"
            echo "   sudo pacman -S imagemagick   # Arch/CachyOS"
            echo "   sudo apt install imagemagick  # Ubuntu/Debian"
        fi
    fi
else
    echo "⚠️ Nem ImageMagick nem npx encontrados"
    echo "   Instale imagemagick: sudo pacman -S imagemagick"
    echo ""
    echo "   Ou gere manualmente PNGs 32x32, 128x128, 256x256"
    echo "   e coloque em $ICONS_DIR/"
fi

echo ""
echo "📁 Ícones em: $ICONS_DIR/"
ls -la "$ICONS_DIR/" 2>/dev/null
