import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type Dispatch,
} from "react";
import { appReducer, initialState } from "./reducer";
import type {
  AppState,
  AppAction,
  AudioEntry,
  ModConfig,
  ToastType,
  TabType,
} from "@/types/audio";
import { originalAudios } from "@/data/originalAudios";
import { generateAndDownloadZipWeb } from "@/utils/zipWeb";

// ─── Constants ──────────────────────────────────────────────────
const STORAGE_KEY = "sdv-audio-mod-autosave";
const SAVE_FORMAT_VERSION = "3.0.0";
const AUTO_SAVE_INTERVAL = 15000;
const IS_DESKTOP = typeof window !== "undefined" && "__TAURI__" in window;

// ─── Helpers ────────────────────────────────────────────────────

function downloadStringAsFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── JSON Builders (shared Web + Desktop) ───────────────────────

function buildManifest(config: ModConfig) {
  return {
    Name: config.modName,
    Author: config.modAuthor,
    Version: config.modVersion,
    Description: config.modDescription,
    UniqueID: config.modId,
    UpdateKeys: [],
    ContentPackFor: { UniqueID: "Pathoschild.ContentPatcher" },
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
        FilePaths: audio.files.map((f) => `{{AbsoluteFilePath: assets/${f}}}`),
        StreamedVorbis: true,
      };
      if (audio.category === "Music" && audio.looped) entry.Looped = true;
      entries[audio.id] = entry;
    }
    changes.push({ Action: "EditData", Target: "Data/AudioChanges", Entries: entries });
  }
  const jukebox = audios.filter((a) => a.jukebox);
  if (jukebox.length > 0) {
    const entries: Record<string, unknown> = {};
    for (const audio of jukebox) {
      if (audio.jukebox) {
        entries[audio.id] = {
          Id: audio.id,
          Name: `{{i18n:Music.${audio.id}}}`,
          Available: audio.jukebox.available,
        };
      }
    }
    changes.push({ Action: "EditData", Target: "Data/JukeboxTracks", Entries: entries });
  }
  return { Format: "2.0.0", Changes: changes };
}

function buildI18n(audios: AudioEntry[]) {
  const map: Record<string, string> = {};
  for (const audio of audios.filter((a) => a.jukebox)) {
    if (audio.jukebox) map[`Music.${audio.id}`] = audio.jukebox.name;
  }
  return map;
}

// ─── Cross-Save Serialization ──────────────────────────────────

interface SavedProjectData {
  config: {
    id?: string; modId?: string;
    name?: string; modName?: string;
    author?: string; modAuthor?: string;
    version?: string; modVersion?: string;
    description?: string; modDescription?: string;
  };
  audios: {
    id: string;
    type?: "replace" | "custom";
    originalName?: string | null;
    category: string;
    files: string[];
    looped: boolean;
    jukebox: { name: string; available: boolean } | null;
  }[];
  version: string;
  saved_at: string;
  platform?: "web" | "desktop";
}

function configToSave(c: ModConfig) {
  return {
    id: c.modId, modId: c.modId,
    name: c.modName, modName: c.modName,
    author: c.modAuthor, modAuthor: c.modAuthor,
    version: c.modVersion, modVersion: c.modVersion,
    description: c.modDescription, modDescription: c.modDescription,
  };
}

function audiosToSave(a: AudioEntry[]) {
  return a.map((x) => ({
    id: x.id, type: x.type, originalName: x.originalName,
    category: x.category, files: x.files, looped: x.looped, jukebox: x.jukebox,
  }));
}

function configFromSave(r: SavedProjectData["config"]): ModConfig {
  return {
    modId: r.modId || r.id || "SeuNome.AudioMod",
    modName: r.modName || r.name || "Meu Mod de Áudio",
    modAuthor: r.modAuthor || r.author || "Seu Nome",
    modVersion: r.modVersion || r.version || "1.0.0",
    modDescription: r.modDescription || r.description || "Adiciona e substitui áudios do jogo",
  };
}

function audiosFromSave(arr: SavedProjectData["audios"]): AudioEntry[] {
  return arr.map((a) => {
    const original = originalAudios.find((o) => o.id.toLowerCase() === a.id.toLowerCase());
    const isReplacing = !!original;
    return {
      id: a.id,
      type: a.type || (isReplacing ? "replace" : "custom"),
      originalName: a.originalName !== undefined ? a.originalName : original?.name || null,
      category: a.category as AudioEntry["category"],
      files: a.files || [],
      looped: a.looped ?? false,
      jukebox: a.jukebox || null,
    };
  });
}

function configToRust(c: ModConfig) {
  return { id: c.modId, name: c.modName, author: c.modAuthor, version: c.modVersion, description: c.modDescription };
}

function audiosToRust(a: AudioEntry[]) {
  return a.map((x) => ({ id: x.id, category: x.category, files: x.files, looped: x.looped, jukebox: x.jukebox }));
}

// ─── localStorage helpers ──────────────────────────────────────

function saveToLocalStorage(state: AppState) {
  try {
    const data: SavedProjectData = {
      config: configToSave(state.modConfig),
      audios: audiosToSave(state.audios),
      version: SAVE_FORMAT_VERSION,
      saved_at: new Date().toISOString(),
      platform: "web",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to auto-save to localStorage:", e);
  }
}

function loadFromLocalStorage(): { config: ModConfig; audios: AudioEntry[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedProjectData;
    if (!parsed.config || !parsed.audios) return null;
    return { config: configFromSave(parsed.config), audios: audiosFromSave(parsed.audios) };
  } catch {
    return null;
  }
}

// ─── Context types ─────────────────────────────────────────────

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

export interface TauriAPI {
  scanFolder: () => Promise<void>;
  rescanFolder: () => Promise<void>;
  watchFolder: () => Promise<void>;
  openInExplorer: (path: string) => Promise<void>;
  copyToClipboard: (text: string) => Promise<void>;
  showNotification: (title: string, body: string) => Promise<void>;
  showConfirm: (msg: string) => Promise<boolean>;
  saveProject: () => Promise<void>;
  loadProject: () => Promise<void>;
  exportToFolder: (copyAudio: boolean) => Promise<void>;
  exportToZip: (includeAudio: boolean) => Promise<void>;
  getManifestJson: () => Promise<string>;
  getContentJson: () => Promise<string>;
  getI18nJson: () => Promise<string>;
  downloadManifest: () => void;
  downloadContent: () => void;
  downloadI18n: () => void;
  downloadZip: () => Promise<void>;
  isDesktop: boolean;
}

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  toast: ToastState;
  showToast: (message: string, type?: ToastType) => void;
  tauri: TauriAPI;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// ─── Tauri helpers ─────────────────────────────────────────────

function tauriImport(module: string): Promise<any> {
  return new Function("m", "return import(m)")(module);
}

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!IS_DESKTOP) throw new Error("Not in Tauri environment");
  const mod = await tauriImport("@tauri-apps/api/core");
  return mod.invoke(cmd, args);
}

// ─── Provider ──────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [toast, setToast] = useReducer(
    (_: ToastState, a: ToastState) => a,
    { message: "", type: "success" as ToastType, visible: false }
  );
  const toastTimeout = useRef<number | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast({ message, type, visible: true });
    toastTimeout.current = window.setTimeout(() => {
      setToast({ message: "", type: "success", visible: false });
    }, 3000);
  }, []);

  // ── Auto-save (both platforms) ────────────────────────────────

  useEffect(() => {
    if (IS_DESKTOP) {
      const interval = setInterval(async () => {
        const s = stateRef.current;
        if (s.audios.length > 0 && s.dirty) {
          try {
            await invoke("auto_save_project", {
              data: {
                config: configToSave(s.modConfig),
                audios: audiosToSave(s.audios),
                version: SAVE_FORMAT_VERSION,
                saved_at: new Date().toISOString(),
                platform: "desktop",
              },
            });
            dispatch({ type: "MARK_SAVED" });
          } catch {}
        }
      }, 30000);
      return () => clearInterval(interval);
    } else {
      const interval = setInterval(() => {
        const s = stateRef.current;
        if (s.dirty) {
          saveToLocalStorage(s);
          dispatch({ type: "MARK_SAVED" });
        }
      }, AUTO_SAVE_INTERVAL);
      return () => clearInterval(interval);
    }
  }, []);

  // ── Auto-restore on startup ──────────────────────────────────

  useEffect(() => {
    if (IS_DESKTOP) {
      (async () => {
        try {
          const data = await invoke<any>("load_auto_save", {});
          if (data && data.audios && data.audios.length > 0) {
            dispatch({
              type: "LOAD_PROJECT",
              payload: { config: configFromSave(data.config), audios: audiosFromSave(data.audios) },
            });
            showToast("💾 Previous project restored", "info");
          }
        } catch {}
      })();
    } else {
      const saved = loadFromLocalStorage();
      if (saved && saved.audios.length > 0) {
        dispatch({ type: "LOAD_PROJECT", payload: saved });
        showToast("💾 Previous project restored from browser", "info");
      }
    }
  }, [showToast]);

  // ── Tauri event listener ──────────────────────────────────────

  useEffect(() => {
    if (!IS_DESKTOP) return;
    let unlisten: (() => void) | null = null;
    (async () => {
      try {
        const eventMod = await tauriImport("@tauri-apps/api/event");
        unlisten = await eventMod.listen("assets-changed", (event: any) => {
          showToast(`📁 Files changed: ${event.payload.files.join(", ")}`, "info");
          invoke("scan_audio_folder", { folderPath: event.payload.folder })
            .then((result) => dispatch({ type: "SET_SCAN_RESULT", payload: result as AppState["scanResult"] }))
            .catch(() => {});
        });
      } catch {}
    })();
    return () => { unlisten?.(); };
  }, [showToast]);

  // ── Web: hidden file input for project loading ────────────────

  useEffect(() => {
    if (IS_DESKTOP) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.sdvaudio";
    input.style.cssText = "position:fixed;top:-100px;left:-100px;opacity:0;pointer-events:none;";
    input.tabIndex = -1;
    input.onchange = (ev) => {
      const file = (ev.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          try {
            const result = re.target?.result as string;
            const parsed = JSON.parse(result) as SavedProjectData;
            if (parsed.config && parsed.audios) {
              const payload = { config: configFromSave(parsed.config), audios: audiosFromSave(parsed.audios) };
              dispatch({ type: "LOAD_PROJECT", payload });
              saveToLocalStorage({ ...stateRef.current, modConfig: payload.config, audios: payload.audios, dirty: false });
              const source = parsed.platform === "desktop" ? " (from Desktop)" : parsed.platform === "web" ? " (from Web)" : "";
              showToast(`📂 Project loaded!${source}`, "success");
            } else {
              throw new Error("Invalid project format");
            }
          } catch (err) {
            console.error(err);
            showToast("Error loading project file", "error");
          }
        };
        reader.readAsText(file);
      }
      input.value = "";
    };
    document.body.appendChild(input);
    fileInputRef.current = input;
    return () => {
      if (fileInputRef.current) {
        document.body.removeChild(fileInputRef.current);
        fileInputRef.current = null;
      }
    };
  }, [showToast]);

  // ── Tauri API methods (each is a stable useCallback) ──────────

  const scanFolder = useCallback(async () => {
    if (!IS_DESKTOP) { showToast("Desktop only.", "info"); return; }
    try {
      const dialog = await tauriImport("@tauri-apps/plugin-dialog");
      const folder = await dialog.open({ directory: true, title: "Select audio folder" });
      if (!folder) return;
      dispatch({ type: "SET_LOADING", payload: { loading: true, message: "🔍 Scanning..." } });
      const result = await invoke("scan_audio_folder", { folderPath: folder });
      dispatch({ type: "SET_SCAN_RESULT", payload: result as AppState["scanResult"] });
      dispatch({ type: "SET_ASSETS_FOLDER", payload: folder as string });
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
      showToast(`🔍 Found ${(result as any)?.files.length ?? 0} files`, "success");
    } catch (err) {
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
      showToast(`Error: ${err}`, "error");
    }
  }, [showToast]);

  const rescanFolder = useCallback(async () => {
    if (!IS_DESKTOP) return;
    const folder = stateRef.current.assetsFolder;
    if (!folder) return;
    try {
      dispatch({ type: "SET_LOADING", payload: { loading: true, message: "🔄 Rescanning..." } });
      const result = await invoke("scan_audio_folder", { folderPath: folder });
      dispatch({ type: "SET_SCAN_RESULT", payload: result as AppState["scanResult"] });
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
      showToast("🔄 Refreshed!", "success");
    } catch (err) {
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
      showToast(`Error: ${err}`, "error");
    }
  }, [showToast]);

  const watchFolder = useCallback(async () => {
    if (!IS_DESKTOP) return;
    const folder = stateRef.current.assetsFolder;
    if (!folder) return;
    try {
      await invoke("watch_assets_folder", { folderPath: folder });
      dispatch({ type: "SET_WATCHING", payload: true });
      showToast("👁️ Watching...", "success");
    } catch (err) { showToast(`Error: ${err}`, "error"); }
  }, [showToast]);

  const openInExplorer = useCallback(async (path: string) => {
    if (!IS_DESKTOP) return;
    try {
      const opener = await tauriImport("@tauri-apps/plugin-opener");
      await opener.revealItemInDir(path);
    } catch (err) { showToast(`Error: ${err}`, "error"); }
  }, [showToast]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      if (IS_DESKTOP) {
        const clipboard = await tauriImport("@tauri-apps/plugin-clipboard-manager");
        await clipboard.writeText(text);
      } else {
        await navigator.clipboard.writeText(text);
      }
      showToast("📋 Copied!", "success");
    } catch (err) { showToast(`Error: ${err}`, "error"); }
  }, [showToast]);

  const showNotification = useCallback(async (title: string, body: string) => {
    if (!IS_DESKTOP) return;
    try {
      const n = await tauriImport("@tauri-apps/plugin-notification");
      if (!(await n.isPermissionGranted())) await n.requestPermission();
      await n.sendNotification({ title, body });
    } catch {}
  }, []);

  const showConfirm = useCallback(async (msg: string) => {
    if (IS_DESKTOP) {
      try {
        const dialog = await tauriImport("@tauri-apps/plugin-dialog");
        return await dialog.confirm(msg, { title: "Confirm" });
      } catch { return window.confirm(msg); }
    }
    return window.confirm(msg);
  }, []);

  const saveProject = useCallback(async () => {
    const s = stateRef.current;
    const projectData: SavedProjectData = {
      config: configToSave(s.modConfig),
      audios: audiosToSave(s.audios),
      version: SAVE_FORMAT_VERSION,
      saved_at: new Date().toISOString(),
      platform: IS_DESKTOP ? "desktop" : "web",
    };
    if (IS_DESKTOP) {
      try {
        const dialog = await tauriImport("@tauri-apps/plugin-dialog");
        const path = await dialog.save({
          defaultPath: `${s.modConfig.modName.replace(/[^a-zA-Z0-9]/g, "_")}.sdvaudio.json`,
          filters: [{ name: "SDV Audio Project", extensions: ["json"] }],
          title: "Save project",
        });
        if (!path) return;
        await invoke("save_project", { path, data: projectData });
        dispatch({ type: "MARK_SAVED" });
        showToast(`💾 Saved: ${path}`, "success");
      } catch (err) { showToast(`Error: ${err}`, "error"); }
    } else {
      const dataStr = JSON.stringify(projectData, null, 2);
      const filename = `${s.modConfig.modName.replace(/[^a-zA-Z0-9]/g, "_")}.sdvaudio.json`;
      downloadStringAsFile(filename, dataStr);
      saveToLocalStorage(s);
      dispatch({ type: "MARK_SAVED" });
      showToast("💾 Project downloaded!", "success");
    }
  }, [showToast]);

  const loadProject = useCallback(async () => {
    if (IS_DESKTOP) {
      try {
        const dialog = await tauriImport("@tauri-apps/plugin-dialog");
        const path = await dialog.open({
          filters: [{ name: "SDV Audio Project", extensions: ["json", "sdvaudio"] }],
          title: "Open project",
        });
        if (!path) return;
        const data = await invoke<any>("load_project", { path });
        const payload = { config: configFromSave(data.config), audios: audiosFromSave(data.audios) };
        dispatch({ type: "LOAD_PROJECT", payload });
        const source = data.platform === "web" ? " (from Web)" : data.platform === "desktop" ? " (from Desktop)" : "";
        showToast(`📂 Project loaded!${source}`, "success");
      } catch (err) { showToast(`Error: ${err}`, "error"); }
    } else {
      fileInputRef.current?.click();
    }
  }, [showToast]);

  const exportToFolder = useCallback(async (copyAudio: boolean) => {
    if (!IS_DESKTOP) return;
    const s = stateRef.current;
    if (s.audios.length === 0) { showToast("Add audios first!", "error"); return; }
    try {
      const dialog = await tauriImport("@tauri-apps/plugin-dialog");
      const folder = await dialog.open({ directory: true, title: "Export folder" });
      if (!folder) return;
      dispatch({ type: "SET_LOADING", payload: { loading: true, message: "📂 Exporting..." } });
      const result = await invoke<any>("export_to_folder", {
        folderPath: folder, config: configToRust(s.modConfig), audios: audiosToRust(s.audios),
        copyAudioFiles: copyAudio, audioSourceFolder: s.assetsFolder,
      });
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
      if (result.success) showToast(`✅ ${result.files_created.length} files exported!`, "success");
    } catch (err) {
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
      showToast(`Error: ${err}`, "error");
    }
  }, [showToast]);

  const exportToZip = useCallback(async (includeAudio: boolean) => {
    if (!IS_DESKTOP) return;
    const s = stateRef.current;
    if (s.audios.length === 0) { showToast("Add audios first!", "error"); return; }
    try {
      const dialog = await tauriImport("@tauri-apps/plugin-dialog");
      const clean = s.modConfig.modName.replace(/[^a-zA-Z0-9 ]/g, "").trim();
      const path = await dialog.save({
        defaultPath: `[CP] ${clean}.zip`,
        filters: [{ name: "ZIP", extensions: ["zip"] }],
        title: "Save ZIP",
      });
      if (!path) return;
      dispatch({ type: "SET_LOADING", payload: { loading: true, message: "📦 Creating ZIP..." } });
      const result = await invoke<any>("export_to_zip", {
        filePath: path, config: configToRust(s.modConfig), audios: audiosToRust(s.audios),
        includeAudioFiles: includeAudio, audioSourceFolder: s.assetsFolder,
      });
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
      if (result.success) showToast("📦 ZIP created!", "success");
    } catch (err) {
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
      showToast(`Error: ${err}`, "error");
    }
  }, [showToast]);

  const getManifestJson = useCallback(async () => {
    const s = stateRef.current;
    if (!IS_DESKTOP) return JSON.stringify(buildManifest(s.modConfig), null, 4);
    return invoke<string>("generate_manifest_json", { config: configToRust(s.modConfig) });
  }, []);

  const getContentJson = useCallback(async () => {
    const s = stateRef.current;
    if (!IS_DESKTOP) return JSON.stringify(buildContent(s.audios), null, 4);
    return invoke<string>("generate_content_json", { audios: audiosToRust(s.audios) });
  }, []);

  const getI18nJson = useCallback(async () => {
    const s = stateRef.current;
    if (!IS_DESKTOP) return JSON.stringify(buildI18n(s.audios), null, 4);
    return invoke<string>("generate_i18n_json", { audios: audiosToRust(s.audios) });
  }, []);

  const downloadManifest = useCallback(() => {
    const s = stateRef.current;
    downloadStringAsFile("manifest.json", JSON.stringify(buildManifest(s.modConfig), null, 4));
    showToast("📜 manifest.json downloaded!", "success");
  }, [showToast]);

  const downloadContent = useCallback(() => {
    const s = stateRef.current;
    if (s.audios.length === 0) { showToast("Add audios first!", "error"); return; }
    downloadStringAsFile("content.json", JSON.stringify(buildContent(s.audios), null, 4));
    showToast("📄 content.json downloaded!", "success");
  }, [showToast]);

  const downloadI18n = useCallback(() => {
    const s = stateRef.current;
    if (s.audios.filter((a) => a.jukebox).length === 0) { showToast("No jukebox audio!", "error"); return; }
    downloadStringAsFile("default.json", JSON.stringify(buildI18n(s.audios), null, 4));
    showToast("🌐 default.json downloaded!", "success");
  }, [showToast]);

  const downloadZip = useCallback(async () => {
    const s = stateRef.current;
    if (s.audios.length === 0) { showToast("Add audios first!", "error"); return; }
    try {
      dispatch({ type: "SET_LOADING", payload: { loading: true, message: "📦 Creating ZIP..." } });
      await generateAndDownloadZipWeb(
        s.modConfig.modName, buildManifest(s.modConfig), buildContent(s.audios), buildI18n(s.audios), s.audios
      );
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
      showToast("📦 ZIP downloaded!", "success");
    } catch (err) {
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
      showToast(`Error: ${err}`, "error");
    }
  }, [showToast]);

  // ── Memoize tauri object so consumers don't re-render ─────────

  const tauri = useMemo<TauriAPI>(() => ({
    scanFolder, rescanFolder, watchFolder, openInExplorer, copyToClipboard,
    showNotification, showConfirm, saveProject, loadProject,
    exportToFolder, exportToZip, getManifestJson, getContentJson, getI18nJson,
    downloadManifest, downloadContent, downloadI18n, downloadZip,
    isDesktop: IS_DESKTOP,
  }), [
    scanFolder, rescanFolder, watchFolder, openInExplorer, copyToClipboard,
    showNotification, showConfirm, saveProject, loadProject,
    exportToFolder, exportToZip, getManifestJson, getContentJson, getI18nJson,
    downloadManifest, downloadContent, downloadI18n, downloadZip,
  ]);

  // ── Keyboard shortcuts ────────────────────────────────────────

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;
      if (e.ctrlKey || e.metaKey) {
        const tabs: TabType[] = IS_DESKTOP
          ? ["setup", "audio", "scan", "export", "help"]
          : ["setup", "audio", "export", "help"];
        const num = parseInt(e.key);
        if (num >= 1 && num <= tabs.length) {
          e.preventDefault();
          dispatch({ type: "SET_TAB", payload: tabs[num - 1] });
        }
        if (e.key === "s") { e.preventDefault(); saveProject(); }
        if (e.key === "o") { e.preventDefault(); loadProject(); }
      }
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [saveProject, loadProject]);

  // ── Memoize context value ─────────────────────────────────────

  const contextValue = useMemo<AppContextValue>(() => ({
    state, dispatch, toast, showToast, tauri,
  }), [state, toast, showToast, tauri]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// ─── Hooks ─────────────────────────────────────────────────────

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
export function useAppState() { return useApp().state; }
export function useAppDispatch() { return useApp().dispatch; }
export function useTauri() { return useApp().tauri; }
export function useToastCtx() {
  const { toast, showToast } = useApp();
  return { toast, showToast };
}
