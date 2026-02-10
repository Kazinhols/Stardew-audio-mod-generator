use std::fs::{self, File};
use std::io::Write;
use std::path::Path;
use serde::{Deserialize, Serialize};
use zip::write::FileOptions;
use zip::ZipWriter;

#[derive(Debug, Deserialize, Serialize)]
pub struct ModConfig {
    id: String,
    name: String,
    author: String,
    version: String,
    description: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct JukeboxConfig {
    name: String,
    available: bool,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Audio {
    id: String,
    #[serde(rename = "type")]
    audio_type: String,
    original_name: Option<String>,
    category: String,
    files: Vec<String>,
    looped: bool,
    jukebox: Option<JukeboxConfig>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SavedProjectData {
    config: serde_json::Value,
    audios: Vec<serde_json::Value>,
    version: String,
    saved_at: String,
    platform: String,
}

#[tauri::command]
pub async fn save_project(path: String, data: SavedProjectData) -> Result<(), String> {
    let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn load_project(path: String) -> Result<SavedProjectData, String> {
    let contents = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let data: SavedProjectData = serde_json::from_str(&contents).map_err(|e| e.to_string())?;
    Ok(data)
}

fn generate_readme(audios: &[Audio], config: &ModConfig) -> String {
    let audio_count = audios.len();
    let file_count: usize = audios
        .iter()
        .flat_map(|a| &a.files)
        .collect::<std::collections::HashSet<_>>()
        .len();

    let audio_list = if audios.is_empty() {
        "(Nenhum áudio configurado)".to_string()
    } else {
        audios
            .iter()
            .enumerate()
            .map(|(i, audio)| {
                let display_name = audio.original_name.as_ref().unwrap_or(&audio.id);
                let category_emoji = match audio.category.as_str() {
                    "Music" => "🎵",
                    "Ambient" => "🌿",
                    "Sound" => "🔊",
                    "Footstep" => "👣",
                    _ => "🎵",
                };
                let type_label = if audio.audio_type == "replace" { "Substitui" } else { "Custom" };
                let loop_label = if audio.looped { "🔁 Loop" } else { "▶️ No Loop" };
                let jukebox_label = audio.jukebox.as_ref()
                    .map(|j| format!(" | 📻 Jukebox: \"{}\"", j.name))
                    .unwrap_or_default();
                
                let files_list = audio.files
                    .iter()
                    .map(|f| format!("     • `{}`", f))
                    .collect::<Vec<_>>()
                    .join("\n");

                format!(
                    "**{}. {} {}** ({})\n   {}{}\n   Arquivos necessários:\n{}",
                    i + 1, category_emoji, display_name, type_label, loop_label, jukebox_label, files_list
                )
            })
            .collect::<Vec<_>>()
            .join("\n\n")
    };

    let all_files: Vec<String> = audios
        .iter()
        .flat_map(|a| &a.files)
        .cloned()
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect::<Vec<_>>();
    let mut sorted_files = all_files;
    sorted_files.sort();

    let files_list = sorted_files
        .iter()
        .map(|f| format!("- `{}`", f))
        .collect::<Vec<_>>()
        .join("\n");

    format!(
        r#"# 🎵 {}

## 📋 O que você baixou

Este arquivo contém um mod de áudio personalizado para Stardew Valley 1.6+.

**Estatísticas:**
- 🎵 {} áudio(s) configurado(s)
- 📁 {} arquivo(s) .ogg necessário(s)

**Arquivos incluídos:**
- `manifest.json` - Configuração do mod
- `content.json` - Define quais áudios substituir
- `i18n/default.json` - Traduções (se aplicável)
- `README.md` - Este arquivo

---

## ⚠️ IMPORTANTE: Adicione os arquivos de áudio!

Este mod **NÃO inclui** os arquivos de áudio (.ogg). Você precisa adicioná-los manualmente na pasta `assets/`.

---

## 🎼 Áudios Configurados

Abaixo está a lista completa de todos os áudios configurados neste mod:

{}

---

## 📁 Lista de Arquivos .ogg Necessários

Você precisa colocar os seguintes **{} arquivos** na pasta **`assets/`**:

{}

> **Formato:** Todos os arquivos devem estar no formato **OGG Vorbis**

---

## 📦 Como Instalar

### 1️⃣ Instalar Dependências

Você precisa ter instalado:
- **SMAPI** - https://smapi.io/
- **Content Patcher** - https://www.nexusmods.com/stardewvalley/mods/1915

### 2️⃣ Instalar o Mod

1. Vá para `C:\Program Files (x86)\Steam\steamapps\common\Stardew Valley\Mods\`
2. Extraia este ZIP
3. **CRIE** uma pasta `assets` dentro da pasta do mod
4. Coloque os **{} arquivos .ogg** dentro de `assets/`

### 3️⃣ Estrutura Final

```
Stardew Valley/
└── Mods/
    └── {}/
        ├── manifest.json
        ├── content.json
        ├── README.md
        ├── i18n/
        │   └── default.json
        └── assets/          ← COLOQUE OS {} ARQUIVOS .OGG AQUI
```

---

## 🎮 Como Usar

1. Inicie o Stardew Valley através do **SMAPI**
2. O mod será carregado automaticamente
3. As músicas serão substituídas conforme configurado!

---

## 🔧 Converter Áudios para .ogg

Use Audacity (https://www.audacityteam.org/) ou FFmpeg.

---

## 📝 Informações do Mod

- **Nome:** {}
- **Autor:** {}
- **Versão:** {}
- **Requer:** SMAPI, Content Patcher
- **Compatibilidade:** Stardew Valley 1.6+
- **Total de Áudios:** {}
- **Total de Arquivos:** {}

---

**Divirta-se com suas músicas personalizadas! 🎵**

*Gerado por: Stardew Audio Mod Generator v3.0*
"#,
        config.name, audio_count, file_count, audio_list, file_count, files_list, 
        file_count, config.name, file_count, config.name, config.author, 
        config.version, audio_count, file_count
    )
}

#[tauri::command]
pub async fn export_to_zip(
    file_path: String,
    config: ModConfig,
    audios: Vec<Audio>,
    include_audio_files: bool,
    audio_source_folder: Option<String>,
) -> Result<serde_json::Value, String> {
    let path = Path::new(&file_path);
    let file = File::create(path).map_err(|e| e.to_string())?;
    let mut zip = ZipWriter::new(file);
    let options = FileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    let clean_name = config.name.chars()
        .filter(|c| c.is_alphanumeric() || c.is_whitespace())
        .collect::<String>()
        .trim()
        .to_string();
    let folder_name = format!("[CP] {}", clean_name);

    // Generate manifest.json
    let manifest = serde_json::json!({
        "Name": config.name,
        "Author": config.author,
        "Version": config.version,
        "Description": config.description,
        "UniqueID": config.id,
        "UpdateKeys": [],
        "ContentPackFor": {
            "UniqueID": "Pathoschild.ContentPatcher",
            "MinimumVersion": "2.0.0"
        }
    });

    zip.start_file(format!("{}/manifest.json", folder_name), options)
        .map_err(|e| e.to_string())?;
    zip.write_all(serde_json::to_string_pretty(&manifest).unwrap().as_bytes())
        .map_err(|e| e.to_string())?;

    // Generate content.json (simplified - you'd need full implementation)
    let content = serde_json::json!({
        "Format": "2.0.0",
        "Changes": []
    });

    zip.start_file(format!("{}/content.json", folder_name), options)
        .map_err(|e| e.to_string())?;
    zip.write_all(serde_json::to_string_pretty(&content).unwrap().as_bytes())
        .map_err(|e| e.to_string())?;

    // Generate README.md
    let readme = generate_readme(&audios, &config);
    zip.start_file(format!("{}/README.md", folder_name), options)
        .map_err(|e| e.to_string())?;
    zip.write_all(readme.as_bytes())
        .map_err(|e| e.to_string())?;

    // Create assets folder
    zip.add_directory(format!("{}/assets", folder_name), options)
        .map_err(|e| e.to_string())?;

    // Copy audio files if requested
    if include_audio_files {
        if let Some(source_folder) = audio_source_folder {
            for audio in &audios {
                for file_name in &audio.files {
                    let source_path = Path::new(&source_folder).join(file_name);
                    if source_path.exists() {
                        let file_data = fs::read(&source_path).map_err(|e| e.to_string())?;
                        zip.start_file(
                            format!("{}/assets/{}", folder_name, file_name),
                            options,
                        )
                        .map_err(|e| e.to_string())?;
                        zip.write_all(&file_data).map_err(|e| e.to_string())?;
                    }
                }
            }
        }
    }

    zip.finish().map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "success": true,
        "path": file_path,
        "message": "ZIP created successfully"
    }))
}

#[tauri::command]
pub async fn export_to_folder(
    folder_path: String,
    config: ModConfig,
    audios: Vec<Audio>,
    include_audio_files: bool,
    audio_source_folder: Option<String>,
) -> Result<serde_json::Value, String> {
    let clean_name = config.name.chars()
        .filter(|c| c.is_alphanumeric() || c.is_whitespace())
        .collect::<String>()
        .trim()
        .to_string();
    let mod_folder = Path::new(&folder_path).join(format!("[CP] {}", clean_name));
    
    fs::create_dir_all(&mod_folder).map_err(|e| e.to_string())?;
    
    // Generate manifest.json
    let manifest = serde_json::json!({
        "Name": config.name,
        "Author": config.author,
        "Version": config.version,
        "Description": config.description,
        "UniqueID": config.id,
        "UpdateKeys": [],
        "ContentPackFor": {
            "UniqueID": "Pathoschild.ContentPatcher",
            "MinimumVersion": "2.0.0"
        }
    });
    
    fs::write(
        mod_folder.join("manifest.json"),
        serde_json::to_string_pretty(&manifest).unwrap()
    ).map_err(|e| e.to_string())?;
    
    // Generate content.json (simplified)
    let content = serde_json::json!({
        "Format": "2.0.0",
        "Changes": []
    });
    
    fs::write(
        mod_folder.join("content.json"),
        serde_json::to_string_pretty(&content).unwrap()
    ).map_err(|e| e.to_string())?;
    
    // Generate README.md
    let readme = generate_readme(&audios, &config);
    fs::write(mod_folder.join("README.md"), readme).map_err(|e| e.to_string())?;
    
    // Create assets folder
    let assets_folder = mod_folder.join("assets");
    fs::create_dir_all(&assets_folder).map_err(|e| e.to_string())?;
    
    // Copy audio files if requested
    if include_audio_files {
        if let Some(source_folder) = audio_source_folder {
            for audio in &audios {
                for file_name in &audio.files {
                    let source_path = Path::new(&source_folder).join(file_name);
                    if source_path.exists() {
                        let dest_path = assets_folder.join(file_name);
                        fs::copy(&source_path, &dest_path).map_err(|e| e.to_string())?;
                    }
                }
            }
        }
    }
    
    Ok(serde_json::json!({
        "success": true,
        "path": mod_folder.to_str().unwrap(),
        "message": "Folder created successfully"
    }))
}

#[tauri::command]
pub async fn generate_manifest_json(config: ModConfig) -> Result<String, String> {
    let manifest = serde_json::json!({
        "Name": config.name,
        "Author": config.author,
        "Version": config.version,
        "Description": config.description,
        "UniqueID": config.id,
        "UpdateKeys": [],
        "ContentPackFor": {
            "UniqueID": "Pathoschild.ContentPatcher",
            "MinimumVersion": "2.0.0"
        }
    });
    
    Ok(serde_json::to_string_pretty(&manifest).unwrap())
}

#[tauri::command]
pub async fn generate_content_json(audios: Vec<Audio>) -> Result<String, String> {
    let content = serde_json::json!({
        "Format": "2.0.0",
        "Changes": []
    });
    
    Ok(serde_json::to_string_pretty(&content).unwrap())
}

#[tauri::command]
pub async fn generate_i18n_json(audios: Vec<Audio>) -> Result<String, String> {
    let i18n = serde_json::json!({});
    Ok(serde_json::to_string_pretty(&i18n).unwrap())
}

#[tauri::command]
pub async fn auto_save_project(data: SavedProjectData) -> Result<(), String> {
    // Auto-save to a temp location or user's documents
    let home_dir = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|e| e.to_string())?;
    
    let auto_save_path = Path::new(&home_dir)
        .join(".stardew-audio-mod")
        .join("autosave.json");
    
    if let Some(parent) = auto_save_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    
    let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(&auto_save_path, json).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn load_auto_save() -> Result<Option<SavedProjectData>, String> {
    let home_dir = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|e| e.to_string())?;
    
    let auto_save_path = Path::new(&home_dir)
        .join(".stardew-audio-mod")
        .join("autosave.json");
    
    if !auto_save_path.exists() {
        return Ok(None);
    }
    
    let contents = fs::read_to_string(&auto_save_path).map_err(|e| e.to_string())?;
    let data: SavedProjectData = serde_json::from_str(&contents).map_err(|e| e.to_string())?;
    Ok(Some(data))
}

