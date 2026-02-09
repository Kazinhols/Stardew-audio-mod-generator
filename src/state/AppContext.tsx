import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
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
import { generateAndDownloadZipWeb } from "@/utils/zipWeb";


function downloadStringAsFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  toast: ToastState;
  showToast: (message: string, type?: ToastType) => void;
  tauri: {
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
  };
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri()) { throw new Error("Not in Tauri environment"); }
  const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
  return tauriInvoke<T>(cmd, args);
}

function configToRust(c: ModConfig) {
  return {
    id: c.modId,
    name: c.modName,
    author: c.modAuthor,
    version: c.modVersion,
    description: c.modDescription,
  };
}

function audiosToRust(a: AudioEntry[]) {
  return a.map((x) => ({
    id: x.id,
    category: x.category,
    files: x.files,
    looped: x.looped,
    jukebox: x.jukebox,
  }));
}

function rustToConfig(r: any): ModConfig {
  return {
    modId: r.id || r.modId,
    modName: r.name || r.modName,
    modAuthor: r.author || r.modAuthor,
    modVersion: r.version || r.modVersion,
    modDescription: r.description || r.modDescription,
  };
}

function rustToAudios(arr: any[]): AudioEntry[] {
  return arr.map((a) => ({
    id: a.id,
    type: "custom" as const,
    originalName: null,
    category: a.category as AudioEntry["category"],
    files: a.files,
    looped: a.looped,
    jukebox: a.jukebox,
  }));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [toast, setToast] = useReducer((_: ToastState, a: ToastState) => a, {
    message: "",
    type: "success" as ToastType,
    visible: false,
  });
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

  useEffect(() => {
    if (!isTauri()) return;
    const interval = setInterval(async () => {
      const s = stateRef.current;
      if (s.audios.length > 0 && s.dirty) {
        try {
          await invoke("auto_save_project", {
            data: {
              config: configToRust(s.modConfig),
              audios: audiosToRust(s.audios),
              version: "3.0.0",
              saved_at: new Date().toISOString(),
            },
          });
          dispatch({ type: "MARK_SAVED" });
        } catch {  }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isTauri()) return;
    (async () => {
      try {
        const data = await invoke<any>("load_auto_save", {});
        if (data && data.audios.length > 0) {
          dispatch({
            type: "LOAD_PROJECT",
            payload: {
              config: rustToConfig(data.config),
              audios: rustToAudios(data.audios),
            },
          });
          showToast("💾 Previous project restored", "info");
        }
      } catch {  }
    })();
  }, []);

  useEffect(() => {
    if (!isTauri()) return;
    let unlisten: (() => void) | null = null;
    (async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        unlisten = await listen<{ folder: string; files: string[]; kind: string; }>("assets-changed", (event) => {
          showToast(`📁 Files changed: ${event.payload.files.join(", ")}`, "info");
          const folder = event.payload.folder;
          invoke("scan_audio_folder", { folderPath: folder })
            .then((result) => dispatch({ type: "SET_SCAN_RESULT", payload: result as AppState["scanResult"] }))
            .catch(() => {});
        });
      } catch {  }
    })();
    return () => { unlisten?.(); };
  }, []);

  useEffect(() => {
    if (!isTauri()) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json,.sdvaudio";
      input.style.cssText = "position: fixed; top: -100px; left: -100px; opacity: 0; pointer-events: none;";
      input.tabIndex = -1;
      
      input.onchange = (ev) => {
        const file = (ev.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (re) => {
            try {
              const result = re.target?.result as string;
              const parsed = JSON.parse(result);
              
              if (parsed.config && parsed.audios) {
                dispatch({ 
                  type: "LOAD_PROJECT", 
                  payload: {
                    config: rustToConfig(parsed.config),
                    audios: rustToAudios(parsed.audios)  
                  }
                });
                showToast("📂 Project loaded!", "success");
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
    }
  }, []);

  const tauri: AppContextValue["tauri"] = {
    scanFolder: useCallback(async () => {
      if (!isTauri()) { showToast("Desktop only.", "info"); return; }
      try {
        const { open } = await import("@tauri-apps/plugin-dialog");
        const folder = await open({ directory: true, title: "Select audio folder" });
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
    }, [showToast]),

    rescanFolder: useCallback(async () => {
      if (!isTauri()) return;
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
    }, [showToast]),

    watchFolder: useCallback(async () => {
      if (!isTauri()) return;
      const folder = stateRef.current.assetsFolder;
      if (!folder) return;
      try {
        await invoke("watch_assets_folder", { folderPath: folder });
        dispatch({ type: "SET_WATCHING", payload: true });
        showToast("👁️ Watching...", "success");
      } catch (err) { showToast(`Error: ${err}`, "error"); }
    }, [showToast]),

    openInExplorer: useCallback(async (path: string) => {
      if (!isTauri()) return;
      try {
        const { revealItemInDir } = await import("@tauri-apps/plugin-opener");
        await revealItemInDir(path);
      } catch (err) { showToast(`Error: ${err}`, "error"); }
    }, [showToast]),

    copyToClipboard: useCallback(async (text: string) => {
      try {
        if (isTauri()) {
          const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
          await writeText(text);
        } else {
          await navigator.clipboard.writeText(text);
        }
        showToast("📋 Copied!", "success");
      } catch (err) { showToast(`Error: ${err}`, "error"); }
    }, [showToast]),

    showNotification: useCallback(async (title: string, body: string) => {
      if (!isTauri()) return;
      try {
        const n = await import("@tauri-apps/plugin-notification");
        if (!(await n.isPermissionGranted())) await n.requestPermission();
        await n.sendNotification({ title, body });
      } catch {  }
    }, []),

    showConfirm: useCallback(async (msg: string) => {
      if (isTauri()) {
        try {
          const { confirm } = await import("@tauri-apps/plugin-dialog");
          return await confirm(msg, { title: "Confirm" });
        } catch { return window.confirm(msg); }
      }
      return window.confirm(msg);
    }, []),

    saveProject: useCallback(async () => {
      const s = stateRef.current;
      const projectData = {
        config: configToRust(s.modConfig),
        audios: audiosToRust(s.audios),    
        version: "3.0.0",
        saved_at: new Date().toISOString(),
      };

      if (isTauri()) {
        try {
          const { save } = await import("@tauri-apps/plugin-dialog");
          const path = await save({
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
        dispatch({ type: "MARK_SAVED" });
        showToast("💾 Project downloaded!", "success");
      }
    }, [showToast]),

    loadProject: useCallback(async () => {
      if (isTauri()) {
        try {
          const { open } = await import("@tauri-apps/plugin-dialog");
          const path = await open({
            filters: [{ name: "SDV Audio Project", extensions: ["json", "sdvaudio"] }],
            title: "Open project",
          });
          if (!path) return;
          const data = await invoke<any>("load_project", { path });
          dispatch({
            type: "LOAD_PROJECT",
            payload: {
              config: rustToConfig(data.config),
              audios: rustToAudios(data.audios),
            },
          });
          showToast("📂 Project loaded!", "success");
        } catch (err) { showToast(`Error: ${err}`, "error"); }
      } else {
        fileInputRef.current?.click();
      }
    }, [showToast]),

    exportToFolder: useCallback(async (copyAudio: boolean) => {
      if (!isTauri()) return;
      const s = stateRef.current;
      if (s.audios.length === 0) { showToast("Add audios first!", "error"); return; }
      try {
        const { open } = await import("@tauri-apps/plugin-dialog");
        const folder = await open({ directory: true, title: "Export folder" });
        if (!folder) return;
        dispatch({ type: "SET_LOADING", payload: { loading: true, message: "📂 Exporting..." } });
        const result = await invoke<any>("export_to_folder", {
          folderPath: folder,
          config: configToRust(s.modConfig),
          audios: audiosToRust(s.audios),
          copyAudioFiles: copyAudio,
          audioSourceFolder: s.assetsFolder,
        });
        dispatch({ type: "SET_LOADING", payload: { loading: false } });
        if (result.success) {
          showToast(`✅ ${result.files_created.length} files exported!`, "success");
        }
      } catch (err) {
        dispatch({ type: "SET_LOADING", payload: { loading: false } });
        showToast(`Error: ${err}`, "error");
      }
    }, [showToast]),

    exportToZip: useCallback(async (includeAudio: boolean) => {
      if (!isTauri()) return;
      const s = stateRef.current;
      if (s.audios.length === 0) { showToast("Add audios first!", "error"); return; }
      try {
        const { save } = await import("@tauri-apps/plugin-dialog");
        const clean = s.modConfig.modName.replace(/[^a-zA-Z0-9 ]/g, "").trim();
        const path = await save({
          defaultPath: `[CP] ${clean}.zip`,
          filters: [{ name: "ZIP", extensions: ["zip"] }],
          title: "Save ZIP",
        });
        if (!path) return;
        dispatch({ type: "SET_LOADING", payload: { loading: true, message: "📦 Creating ZIP..." } });
        const result = await invoke<any>("export_to_zip", {
          filePath: path,
          config: configToRust(s.modConfig),
          audios: audiosToRust(s.audios),
          includeAudioFiles: includeAudio,
          audioSourceFolder: s.assetsFolder,
        });
        dispatch({ type: "SET_LOADING", payload: { loading: false } });
        if (result.success) showToast("📦 ZIP created!", "success");
      } catch (err) {
        dispatch({ type: "SET_LOADING", payload: { loading: false } });
        showToast(`Error: ${err}`, "error");
      }
    }, [showToast]),

    getManifestJson: useCallback(async () => {
      const s = stateRef.current;
      if (!isTauri()) return JSON.stringify(buildManifest(s.modConfig), null, 4);
      return invoke<string>("generate_manifest_json", { config: configToRust(s.modConfig) });
    }, []),

    getContentJson: useCallback(async () => {
      const s = stateRef.current;
      if (!isTauri()) return JSON.stringify(buildContent(s.audios), null, 4);
      return invoke<string>("generate_content_json", { audios: audiosToRust(s.audios) });
    }, []),

    getI18nJson: useCallback(async () => {
      const s = stateRef.current;
      if (!isTauri()) return JSON.stringify(buildI18n(s.audios), null, 4);
      return invoke<string>("generate_i18n_json", { audios: audiosToRust(s.audios) });
    }, []),

    downloadManifest: useCallback(() => {
      const s = stateRef.current;
      downloadStringAsFile("manifest.json", JSON.stringify(buildManifest(s.modConfig), null, 4));
      showToast("📜 manifest.json downloaded!", "success");
    }, [showToast]),

    downloadContent: useCallback(() => {
      const s = stateRef.current;
      if (s.audios.length === 0) { showToast("Add audios first!", "error"); return; }
      downloadStringAsFile("content.json", JSON.stringify(buildContent(s.audios), null, 4));
      showToast("📄 content.json downloaded!", "success");
    }, [showToast]),

    downloadI18n: useCallback(() => {
      const s = stateRef.current;
      if (s.audios.filter(a => a.jukebox).length === 0) { showToast("No jukebox audio!", "error"); return; }
      downloadStringAsFile("default.json", JSON.stringify(buildI18n(s.audios), null, 4));
      showToast("🌐 default.json downloaded!", "success");
    }, [showToast]),

    downloadZip: useCallback(async () => {
      const s = stateRef.current;
      if (s.audios.length === 0) { showToast("Add audios first!", "error"); return; }
      try {
        dispatch({ type: "SET_LOADING", payload: { loading: true, message: "📦 Creating ZIP..." } });
        await generateAndDownloadZipWeb(
          s.modConfig.modName,
          buildManifest(s.modConfig),
          buildContent(s.audios),
          buildI18n(s.audios),
          []
        );
        dispatch({ type: "SET_LOADING", payload: { loading: false } });
        showToast("📦 ZIP downloaded!", "success");
      } catch (err) {
        dispatch({ type: "SET_LOADING", payload: { loading: false } });
        showToast(`Error: ${err}`, "error");
      }
    }, [showToast]),

    isDesktop: isTauri(),
  };

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.ctrlKey || e.metaKey) {
        const tabs: TabType[] = isTauri()
          ? ["setup", "audio", "scan", "export", "help"]
          : ["setup", "audio", "export", "help"];
        const num = parseInt(e.key);
        if (num >= 1 && num <= tabs.length) {
          e.preventDefault();
          dispatch({ type: "SET_TAB", payload: tabs[num - 1] });
        }
        if (e.key === "s") {
          e.preventDefault();
          tauri.saveProject();
        }
        if (e.key === "o") {
          e.preventDefault();
          tauri.loadProject();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [tauri, dispatch]);

  return (
    <AppContext.Provider value={{ state, dispatch, toast, showToast, tauri }}>
      {children}
    </AppContext.Provider>
  );
}

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