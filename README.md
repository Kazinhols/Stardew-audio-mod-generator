<div align="center">

# 🎵 Stardew Audio Mod Generator v3.0

**Gerador visual de mods de áudio para Stardew Valley 1.6+ com Content Patcher.**

Crie, valide e exporte — tudo em uma interface moderna e intuitiva.

[![Version](https://img.shields.io/badge/version-3.0.0-blue?style=for-the-badge)](https://github.com/Kazinhols/stardew-audio-mod-generator/releases)
[![Stardew Valley](https://img.shields.io/badge/Stardew%20Valley-1.6+-green?style=for-the-badge&logo=steam)](https://www.stardewvalley.net/)
[![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)](LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?style=for-the-badge&logo=tauri)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Rust](https://img.shields.io/badge/Rust-stable-orange?style=for-the-badge&logo=rust)](https://www.rust-lang.org/)

<br />

[🌐 **Usar Online**](http://stardewaudiohq.qzz.io/) · [📥 **Download Desktop**](https://github.com/Kazinhols/stardew-audio-mod-generator/releases/latest) · [🐛 **Reportar Bug**](https://github.com/Kazinhols/stardew-audio-mod-generator/issues) · [💡 **Sugerir Feature**](https://github.com/Kazinhols/stardew-audio-mod-generator/issues)

</div>

---

## 📋 Sumário

- [🌐 Acesso Rápido](#-acesso-rápido)
- [✨ Funcionalidades](#-funcionalidades)
- [📸 Screenshots](#-screenshots)
- [🏗️ Arquitetura](#️-arquitetura)
- [🛠️ Guia de Desenvolvimento](#️-guia-de-desenvolvimento)
  - [Pré-requisitos](#pré-requisitos)
  - [Windows](#1-windows)
  - [Linux](#2-linux-debianubuntupop_os)
- [📁 Estrutura do Projeto](#-estrutura-do-projeto)
- [🤝 Contribuindo](#-contribuindo)
- [📄 Licença](#-licença)

---

## 🌐 Acesso Rápido

| Plataforma | Link | Descrição |
|:---:|:---|:---|
| 🌐 **Web** | [**stardewaudiohq.qzz.io**](http://stardewaudiohq.qzz.io/) | Use no navegador, sem instalação |
| 🪟 **Windows** | [**Baixar .exe**](https://github.com/Kazinhols/stardew-audio-mod-generator/releases/latest) | Instalador para Windows 10/11 |
| 🐧 **Linux** | [**Baixar .deb / .AppImage**](https://github.com/Kazinhols/stardew-audio-mod-generator/releases/latest) | Ubuntu/Debian (.deb) ou Portátil (.AppImage) |

> 💡 **Dica:** A versão Desktop oferece funcionalidades exclusivas como escrita direta em disco, compressão ZIP nativa e performance superior via Rust.

---

## ✨ Funcionalidades

| Feature | Descrição | Disponível em |
|:---|:---|:---:|
| 🎨 **Interface Visual** | Crie mods complexos sem tocar em arquivos JSON | Web + Desktop |
| 🔍 **Validação de Áudio** | Scanner nativo em Rust verifica OGG Vorbis vs Opus | Web + Desktop |
| 📂 **Exportação Direta** | Salva arquivos diretamente na pasta do mod | 🖥️ Desktop |
| 📦 **ZIP Nativo** | Compressão ultra-rápida usando Rust | 🖥️ Desktop |
| 👁️ **File Watcher** | Detecta mudanças nos arquivos de áudio em tempo real | 🖥️ Desktop |
| 🌙 **Tema Claro/Escuro** | Interface personalizável com transição suave | Web + Desktop |
| 🌎 **Idiomas** | Suporte completo a PT-BR e EN-US | Web + Desktop |
| 💾 **Auto-save** | Nunca perca seu progresso (armazenamento local) | Web + Desktop |
| ⚡ **Performance** | Backend Rust para operações pesadas sem travar a UI | 🖥️ Desktop |

---

## 📸 Screenshots

<!-- Adicione screenshots aqui -->
<!-- ![Editor Visual](docs/screenshots/editor.png) -->
<!-- ![JSON Preview](docs/screenshots/json-preview.png) -->

> 📷 Screenshots em breve. Enquanto isso, [teste a versão online](http://stardewaudiohq.qzz.io/)!

---

## 🏗️ Arquitetura

O projeto utiliza uma arquitetura híbrida com **React** no frontend e **Rust** no backend, comunicando-se via IPC do Tauri.

```
┌─────────────────────────────────┐     IPC     ┌─────────────────────────────────┐
│        Frontend (React 19)      │◄───────────►│       Backend (Tauri + Rust)    │
├─────────────────────────────────┤             ├─────────────────────────────────┤
│  • Context API (Estado global)  │  Invoca ──► │  • ogg crate (Validação)        │
│  • Immer (Mutações imutáveis)   │             │  • walkdir (Scanner de arquivos) │
│  • TailwindCSS (Estilização)    │  ◄── Dados  │  • zip crate (Compressão)       │
│  • i18n (PT-BR / EN-US)        │             │  • notify (File Watcher)        │
└─────────────────────────────────┘             └─────────────────────────────────┘
```

---

## 🛠️ Guia de Desenvolvimento

Para desenvolvedores que querem modificar o código ou compilar manualmente.

### Pré-requisitos

| Ferramenta | Versão Mínima | Instalação |
|:---|:---|:---|
| **Node.js** | v18+ | [nodejs.org](https://nodejs.org/) |
| **Rust** | Estável (latest) | [rustup.rs](https://rustup.rs/) |

### 1. Windows

```powershell
# 1. Instalar ferramentas de build do Visual Studio (C++)
winget install Microsoft.VisualStudio.2022.BuildTools

# 2. Instalar dependências do projeto
npm install

# 3. Rodar em modo de desenvolvimento (Hot Reload)
npm run tauri dev

# 4. Criar executável final (.exe)
npm run tauri build
```

### 2. Linux (Debian/Ubuntu/Pop!_OS)

```bash
# 1. Instalar dependências do sistema
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl wget \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev

# 2. Instalar Rust (se ainda não tiver)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 3. Instalar dependências do projeto
npm install

# 4. Rodar em modo de desenvolvimento
npm run tauri dev

# 5. Criar executável final (.deb e .AppImage)
npm run tauri build
```

---

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Siga os passos abaixo:

1. 🍴 **Fork** o repositório
2. 🌿 **Crie uma branch** para sua feature (`git checkout -b feature/minha-feature`)
3. ✅ **Commit** suas mudanças (`git commit -m "feat: minha nova funcionalidade"`)
4. 📤 **Push** para a branch (`git push origin feature/minha-feature`)
5. 🔄 **Abra um Pull Request**

### Diretrizes

- Siga o padrão de código existente (ESLint + Prettier)
- Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`)
- Teste suas alterações antes de abrir o PR
- Atualize a documentação se necessário

---

## 📄 Licença

Este projeto está licenciado sob a **[Licença MIT](LICENSE)** — use, modifique e distribua livremente.

---

<div align="center">

Desenvolvido com ❤️ por [**Kazinhols**](https://github.com/Kazinhols)

*Stardew Valley é uma marca registrada de ConcernedApe. Este projeto não é afiliado.*

⭐ **Se este projeto te ajudou, considere dar uma estrela!** ⭐

</div>
