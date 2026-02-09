# 🎵 Stardew Audio Mod Generator v3.0

Gerador visual de mods de áudio para **Stardew Valley 1.6+** com Content Patcher.

![Version](https://img.shields.io/badge/version-3.0.0-blue)
![Stardew Valley](https://img.shields.io/badge/Stardew%20Valley-1.6+-green)
![License](https://img.shields.io/badge/license-MIT-orange)
![Tauri](https://img.shields.io/badge/Tauri-2.0-blue)
![React](https://img.shields.io/badge/React-19-cyan)

## ✨ Funcionalidades

- 🎨 Interface visual — nada de editar JSON manualmente
- 🔍 Scanner de áudio nativo — valida OGG Vorbis vs Opus em Rust
- 📂 Exportação direta para disco — sem download, escreve direto
- 📦 ZIP nativo — compressão em Rust (muito mais rápido que JS)
- 👁️ File watcher — detecta mudanças na pasta de assets em tempo real
- 🌙 Tema claro/escuro
- 🌍 Bilíngue (PT/EN)
- 💾 Auto-save nativo (AppData)
- 🔔 Notificações do sistema

## 🖥️ Compilar para Desktop

👉 **Veja o guia completo: [BUILD_DESKTOP.md](BUILD_DESKTOP.md)**

### Resumo:

**Windows:**
```powershell
# 1. Instalar Rust: winget install Rustlang.Rustup
# 2. Instalar VS Build Tools: winget install Microsoft.VisualStudio.2022.BuildTools
npm install
npm install -D @tauri-apps/cli
npx tauri build
# → Instaladores em src-tauri/target/release/bundle/msi/ e nsis/
```

**Linux:**
```bash
# 1. Instalar Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# 2. Instalar deps: sudo apt install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
npm install
npm install -D @tauri-apps/cli
npx tauri build
# → Pacotes em src-tauri/target/release/bundle/appimage/, deb/, rpm/
```

### Tamanho final: ~3-5 MB (vs ~150 MB do Electron)

## 🏗️ Arquitetura

```
┌──────────────────────────────────────────┐
│              React Frontend              │
│  useReducer + Immer + React.lazy + memo  │
│  Context (State, Theme, Language)        │
│  ErrorBoundary + Suspense                │
└─────────────────┬────────────────────────┘
                  │ invoke()
┌─────────────────▼────────────────────────┐
│              Rust Backend                │
│  ogg crate     → Validação OGG nativa    │
│  walkdir       → Scanner de pastas       │
│  zip crate     → Compressão nativa       │
│  notify        → File watcher            │
│  serde_json    → Serialização JSON       │
│  chrono        → Timestamps              │
│  Tauri Plugins → dialog, fs, clipboard,  │
│                  notification, opener,   │
│                  os, process, shell      │
└──────────────────────────────────────────┘
```

## 📄 Licença

MIT © Kazinhols
