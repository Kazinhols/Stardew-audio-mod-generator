import JSZip from 'jszip';
import type { ModConfig, AudioEntry } from '@/types/audio';

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

function buildManifest(config: ModConfig) {
  return {
    Name: config.modName,
    Author: config.modAuthor,
    Version: config.modVersion,
    Description: config.modDescription,
    UniqueID: config.modId,
    UpdateKeys: [],
    ContentPackFor: { UniqueID: "Pathoschild.ContentPatcher" }
  };
}

function buildContent(audios: AudioEntry[]) {
  const changes = [];
  
  if (audios.length > 0) {
    const entries: Record<string, unknown> = {};
    for (const audio of audios) {
      const entry: Record<string, unknown> = {
        Id: audio.id,
        Category: audio.category,
        FilePaths: audio.files.map(f => `{{AbsoluteFilePath: assets/${f}}}`),
        StreamedVorbis: true
      };
      if (audio.category === 'Music' && audio.looped) {
        entry.Looped = true;
      }
      entries[audio.id] = entry;
    }
    changes.push({ Action: "EditData", Target: "Data/AudioChanges", Entries: entries });
  }

  const jukebox = audios.filter(a => a.jukebox);
  if (jukebox.length > 0) {
    const entries: Record<string, unknown> = {};
    for (const audio of jukebox) {
      if (audio.jukebox) {
        entries[audio.id] = {
          Id: audio.id,
          Name: `{{i18n:Music.${audio.id}}}`,
          Available: audio.jukebox.available
        };
      }
    }
    changes.push({ Action: "EditData", Target: "Data/JukeboxTracks", Entries: entries });
  }

  return { Format: "2.0.0", Changes: changes };
}

function buildI18n(audios: AudioEntry[]) {
  const map: Record<string, string> = {};
  for (const audio of audios.filter(a => a.jukebox)) {
    if (audio.jukebox) {
      map[`Music.${audio.id}`] = audio.jukebox.name;
    }
  }
  return map;
}

export function generateManifestJsonWeb(config: ModConfig): string {
  return JSON.stringify(buildManifest(config), null, 4);
}

export function generateContentJsonWeb(audios: AudioEntry[]): string {
  return JSON.stringify(buildContent(audios), null, 4);
}

export function generateI18nJsonWeb(audios: AudioEntry[]): string {
  return JSON.stringify(buildI18n(audios), null, 4);
}

export function downloadFile(filename: string, content: string, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadAsZip(config: ModConfig, audios: AudioEntry[]): Promise<void> {
  const zip = new JSZip();
  const cleanName = config.modName.replace(/[^a-zA-Z0-9 ]/g, '');
  const folderName = `[CP] ${cleanName}`;
  const folder = zip.folder(folderName)!;

  folder.file('manifest.json', JSON.stringify(buildManifest(config), null, 4));
  folder.file('content.json', JSON.stringify(buildContent(audios), null, 4));
  folder.folder('i18n')!.file('default.json', JSON.stringify(buildI18n(audios), null, 4));

  const reqFiles = [...new Set(audios.flatMap(a => a.files))];
  const readme = `ASSETS FOLDER
==================

Place your .ogg audio files here.

Required files:
${reqFiles.map(f => `  - ${f}`).join('\n')}

IMPORTANT:
- Use OGG Vorbis format (NOT Opus!)
- Sample rate: 44100Hz or 48000Hz
- Use Audacity to convert if needed

Total files needed: ${reqFiles.length}
`;
  folder.folder('assets')!.file('README.txt', readme);

  const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${folderName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function copyToClipboardWeb(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function saveToLocalStorage(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { }
}

export function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}
