# Script para compilar o Stardew Audio Mod Generator para Windows
# Execute como: .\scripts\build-windows.ps1

Write-Host "🎵 Stardew Audio Mod Generator - Build Windows" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Rust está instalado
try {
    $rustVersion = rustc --version
    Write-Host "✅ Rust encontrado: $rustVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Rust não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instale o Rust com:" -ForegroundColor Yellow
    Write-Host "  winget install Rustlang.Rustup" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou baixe de: https://rustup.rs" -ForegroundColor White
    exit 1
}

# Verificar Visual Studio Build Tools
$vsWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
if (Test-Path $vsWhere) {
    $vsPath = & $vsWhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
    if ($vsPath) {
        Write-Host "✅ Visual Studio Build Tools encontrado" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Visual Studio Build Tools pode não estar completo" -ForegroundColor Yellow
        Write-Host "   Instale com: winget install Microsoft.VisualStudio.2022.BuildTools" -ForegroundColor White
    }
} else {
    Write-Host "⚠️  Não foi possível verificar Visual Studio Build Tools" -ForegroundColor Yellow
}

Write-Host ""

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado!" -ForegroundColor Red
    Write-Host "  Instale com: winget install OpenJS.NodeJS" -ForegroundColor White
    exit 1
}

# Instalar dependências npm
Write-Host ""
Write-Host "📦 Instalando dependências npm..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências npm" -ForegroundColor Red
    exit 1
}

# Instalar CLI do Tauri se necessário
Write-Host ""
Write-Host "📦 Verificando Tauri CLI..." -ForegroundColor Cyan
npm install -D @tauri-apps/cli

try {
    $tauriVersion = npx tauri --version
    Write-Host "✅ Tauri CLI: $tauriVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao instalar Tauri CLI" -ForegroundColor Red
    exit 1
}

# Compilar
Write-Host ""
Write-Host "🔨 Compilando aplicação..." -ForegroundColor Cyan
Write-Host "   Isso pode demorar alguns minutos na primeira vez..." -ForegroundColor Gray
Write-Host ""

npm run tauri build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Erro durante a compilação" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possíveis soluções:" -ForegroundColor Yellow
    Write-Host "  1. Instale Visual Studio Build Tools completo" -ForegroundColor White
    Write-Host "  2. Reinicie o terminal após instalar Rust" -ForegroundColor White
    Write-Host "  3. Execute 'rustup update' para atualizar Rust" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "✅ Build concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Arquivos gerados em:" -ForegroundColor Cyan
Write-Host "   src-tauri\target\release\bundle\" -ForegroundColor White
Write-Host ""
Write-Host "   📦 MSI:  bundle\msi\*.msi" -ForegroundColor Gray
Write-Host "   📦 NSIS: bundle\nsis\*.exe" -ForegroundColor Gray
Write-Host ""

# Abrir pasta
$openFolder = Read-Host "Deseja abrir a pasta com os instaladores? (S/N)"
if ($openFolder -eq "S" -or $openFolder -eq "s") {
    explorer "src-tauri\target\release\bundle"
}
