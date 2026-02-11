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

> 💡 **Dica:** A versão Desktop oferece funcionalidades exclusivas como scanner nativo de áudios, exportação direta para pasta e compressão ZIP via Rust.

---

## ✨ Funcionalidades

| Feature | Descrição | Disponível em |
|:---|:---|:---:|
| 🎨 **Interface Visual** | Crie mods complexos sem tocar em arquivos JSON | Web + Desktop |
| 🧩 **Editor de Áudios** | Adicione, remova e categorize `AudioCues` (Music, Ambient, Sound, Footstep) | Web + Desktop |
| 🔍 **Scanner de Áudio** | Scanner nativo em Rust para OGG/WAV (Vorbis vs Opus, sample rate, canais, tamanho) | 🖥️ Desktop |
| 🎧 **Reprodutor & Conversor** | Player integrado + conversão OGG ↔ WAV via FFmpeg | 🖥️ Desktop |
| 📂 **Exportação Direta** | Salva `manifest.json`, `content.json`, `i18n/default.json` e `assets/` direto na pasta do mod | 🖥️ Desktop |
| 📦 **ZIP Nativo** | Gera `[CP] Meu Mod.zip` com estrutura completa usando Rust | 🖥️ Desktop |
| 🌐 **Geração de JSON (Web)** | Baixe `manifest.json`, `content.json` e `i18n/default.json` direto pelo navegador | 🌐 Web |
| 🔁 **Cross-save Web ↔ Desktop** | Abra projetos `.sdvaudio.json` em ambas versões sem conversão | Web + Desktop |
| 💾 **Auto-save** | Auto-save periódico (LocalStorage na Web, arquivo temporário no Desktop) | Web + Desktop |
| 🌙 **Tema Claro/Escuro** | UI temática inspirada em Stardew (noite e fazenda) | Web + Desktop |
| 🌎 **Idiomas** | Suporte completo a PT-BR e EN-US | Web + Desktop |
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

```text
┌───────────────────────────────────────┐    IPC    ┌───────────────────────────────────────┐
│          Frontend (React 19)         │◄──────────►│          Backend (Tauri + Rust)       │
├───────────────────────────────────────┤            ├───────────────────────────────────────┤
│ • Context API (estado global)        │ invoca     │ • ogg crate (validação Vorbis/Opus)   │
│ • Immer (mutações imutáveis)         │  comandos  │ • walkdir (scanner recursivo)         │
│ • TailwindCSS + tema Stardew         │            │ • zip crate (compressão ZIP)          │
│ • i18n (PT-BR / EN-US)               │   dados    │ • notify (file watcher)               │
│ • React.lazy + Suspense (tabs)       │  de volta  │ • FFmpeg (conversão OGG ↔ WAV)        │
└───────────────────────────────────────┘            └───────────────────────────────────────┘
