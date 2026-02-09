export type AudioCategory = 'Music' | 'Ambient' | 'Sound' | 'Footstep';
export type TabType = 'setup' | 'audio' | 'scan' | 'export' | 'help';
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface JukeboxConfig {
  name: string;
  available: boolean;
}

export interface AudioEntry {
  id: string;
  type: 'replace' | 'custom';
  originalName: string | null;
  category: AudioCategory;
  files: string[];
  looped: boolean;
  jukebox: JukeboxConfig | null;
}

export interface ModConfig {
  modId: string;
  modName: string;
  modAuthor: string;
  modVersion: string;
  modDescription: string;
}

export interface OriginalAudio {
  id: string;
  name: string;
  category: string;
}


export interface AudioFileInfo {
  name: string;
  path: string;
  size_bytes: number;
  size_display: string;
  is_valid_ogg: boolean;
  is_vorbis: boolean;
  error: string | null;
  duration_secs: number | null;
  sample_rate: number | null;
  channels: number | null;
}

export interface ScanResult {
  folder: string;
  files: AudioFileInfo[];
  total_valid: number;
  total_invalid: number;
  total_size: string;
}

export interface ExportResult {
  success: boolean;
  path: string;
  message: string;
  files_created: string[];
}

export interface ProjectData {
  config: {
    id: string;
    name: string;
    author: string;
    version: string;
    description: string;
  };
  audios: {
    id: string;
    category: string;
    files: string[];
    looped: boolean;
    jukebox: JukeboxConfig | null;
  }[];
  version: string;
  saved_at: string;
}

export interface AppState {
  modConfig: ModConfig;
  audios: AudioEntry[];
  activeTab: TabType;
  assetsFolder: string | null;
  loading: boolean;
  loadingMessage: string;
  scanResult: ScanResult | null;
  watching: boolean;
  dirty: boolean;
}

export type AppAction =
  | { type: 'SET_CONFIG'; payload: Partial<ModConfig> }
  | { type: 'SET_CONFIG_FULL'; payload: ModConfig }
  | { type: 'ADD_AUDIO'; payload: AudioEntry }
  | { type: 'REMOVE_AUDIO'; payload: number }
  | { type: 'UPDATE_AUDIO'; payload: { index: number; audio: AudioEntry } }
  | { type: 'REORDER_AUDIO'; payload: { from: number; to: number } }
  | { type: 'CLEAR_AUDIOS' }
  | { type: 'SET_TAB'; payload: TabType }
  | { type: 'SET_ASSETS_FOLDER'; payload: string | null }
  | { type: 'SET_LOADING'; payload: { loading: boolean; message?: string } }
  | { type: 'SET_SCAN_RESULT'; payload: ScanResult | null }
  | { type: 'SET_WATCHING'; payload: boolean }
  | { type: 'LOAD_PROJECT'; payload: { config: ModConfig; audios: AudioEntry[] } }
  | { type: 'RESET' }
  | { type: 'MARK_SAVED' };