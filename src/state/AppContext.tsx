import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
import { useLanguage } from "@/contexts/LanguageContext";

const STORAGE_KEY = "sdv-audio-mod-autosave";
const SAVE_FORMAT_VERSION = "3.0.0";
const AUTO_SAVE_INTERVAL = 15000;

let IS_TAURI_CACHED: boolean | null = null;

function detectTauri(): boolean {
  if (IS_TAURI_CACHED !== null) return IS_TAURI_CACHED;
  if (typeof window === "undefined") return false;

  const w = window as any;
  const detected = !!(
    w.__TAURI__ ||
    w.__TAURI_INTERNALS__ ||
    w.__TAURI_IPC__ ||
    (w.__TAURI_METADATA__ && w.__TAURI_METADATA__.currentWindow)
  );

  IS_TAURI_CACHED = detected;
  return detected;
}

async function invoke<T = any>(
  cmd: string,
  args?: Record<string, unknown>
): Promise<T> {
  const w = window as any;
  if (w.__TAURI__?.core?.invoke) return w.__TAURI__.core.invoke(cmd, args);
  if (w.__TAURI__?.invoke) return w.__TAURI__.invoke(cmd, args);
  if (w.__TAURI_INTERNALS__?.invoke)
    return w.__TAURI_INTERNALS__.invoke(cmd, args);
  throw new Error("Tauri invoke not available");
}

async function dialogOpen(opts: {
  directory?: boolean;
  multiple?: boolean;
  title?: string;
  filters?: { name: string; extensions: string[] }[];
}): Promise<string | string[] | null> {
  if (!detectTauri()) {
    const result = window.prompt(opts.title || "Enter path:");
    return result || null;
  }
  try {
    const result = await invoke<string | string[] | null>(
      "plugin:dialog|open",
      {
        options: {
          directory: opts.directory ?? false,
          multiple: opts.multiple ?? false,
          title: opts.title ?? undefined,
          filters: opts.filters ?? undefined,
          defaultPath: undefined,
          canCreateDirectories: true,
        },
      }
    );
    return result;
  } catch (err) {
    console.error("Dialog open error:", err);
    const result = window.prompt(opts.title || "Enter path:");
    return result || null;
  }
}

async function dialogSave(opts: {
  defaultPath?: string;
  title?: string;
  filters?: { name: string; extensions: string[] }[];
}): Promise<string | null> {
  if (!detectTauri()) {
    const result = window.prompt(
      opts.title || "Enter save path:",
      opts.defaultPath
    );
    return result || null;
  }
  try {
    const result = await invoke<string | null>("plugin:dialog|save", {
      options: {
        defaultPath: opts.defaultPath ?? undefined,
        title: opts.title ?? undefined,
        filters: opts.filters ?? undefined,
        canCreateDirectories: true,
      },
    });
    return result;
  } catch (err) {
    console.error("Dialog save error:", err);
    const result = window.prompt(
      opts.title || "Enter save path:",
      opts.defaultPath
    );
    return result || null;
  }
}

async function dialogConfirm(
  message: string,
  title?: string
): Promise<boolean> {
  if (!detectTauri()) {
    return window.confirm(message);
  }
  try {
    const result = await invoke<boolean>("plugin:dialog|confirm", {
      message,
      title: title ?? "Confirmar",
      kind: "warning",
      okLabel: "Sim",
      cancelLabel: "Não",
    });
    return result;
  } catch (err) {
    console.error("Dialog confirm error:", err);
    return window.confirm(message);
  }
}

async function clipboardWrite(text: string): Promise<void> {
  if (!detectTauri()) {
    await navigator.clipboard.writeText(text);
    return;
  }
  try {
    await invoke("plugin:clipboard-manager|write_text", { text });
  } catch (err) {
    console.error("Clipboard error:", err);
    await navigator.clipboard.writeText(text);
  }
}

async function openerReveal(path: string): Promise<void> {
  if (!detectTauri()) {
    console.warn("Opener only available in Desktop mode");
    return;
  }

  const errors: string[] = [];

  try {
    await invoke("open_in_explorer", { path });
    return;
  } catch (err: any) {
    errors.push(`custom: ${err}`);
  }

  try {
    await invoke("plugin:opener|reveal_item_in_dir", { path });
    return;
  } catch (err: any) {
    errors.push(`opener/reveal: ${err}`);
  }

  try {
    await invoke("plugin:opener|open_path", { path });
    return;
  } catch (err: any) {
    errors.push(`opener/open_path: ${err}`);
  }

  try {
    await invoke("plugin:shell|open", { path });
    return;
  } catch (err: any) {
    errors.push(`shell/open: ${err}`);
  }

  console.error("All methods failed:", errors);
  throw new Error(`Could not open file explorer. Attempts: ${errors.join(" | ")}`);
}

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


function buildManifest(config: ModConfig) {
  return {
    Name: config.modName,
    Author: config.modAuthor,
    Version: config.modVersion,
    Description: config.modDescription,
    UniqueID: config.modId,
    UpdateKeys: [],
    ContentPackFor: {
      UniqueID: "Pathoschild.ContentPatcher",
    },
  };
}

function buildContent(audios: AudioEntry[]) {
  const Changes: any[] = [];
  for (const audio of audios) {
    if (audio.files.length === 0) continue;
    const fileEntry = audio.files.length === 1 ? audio.files[0] : audio.files;
    const obj: any = {
      Action: "EditData",
      Target: "Data/AudioCues",
      Entries: {
        [audio.id]: {
          Category: audio.category,
          FilePaths: Array.isArray(fileEntry) ? fileEntry : [fileEntry],
          Looped: audio.looped,
        },
      },
    };
    if (audio.jukebox) {
      obj.Entries[audio.id].Jukebox = audio.jukebox;
    }
    Changes.push(obj);
  }
  return { Changes };
}

function buildI18n(audios: AudioEntry[]) {
  const obj: any = {};
  for (const audio of audios) {
    if (audio.jukebox) {
      obj[`AudioCue.${audio.id}.Name`] = audio.jukebox.name;
    }
  }
  return obj;
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

function audiosToRust(audios: AudioEntry[]) {
  return audios.map((a) => ({
    id: a.id,
    category: a.category,
    files: a.files,
    looped: a.looped,
    jukebox: a.jukebox,
  }));
}

function configFromSave(c: any): ModConfig {
  return {
    modId: c.id || c.modId,
    modName: c.name || c.modName,
    modAuthor: c.author || c.modAuthor,
    modVersion: c.version || c.modVersion,
    modDescription: c.description || c.modDescription,
  };
}

function audiosFromSave(audios: any[]): AudioEntry[] {
  return audios.map((a) => ({
    id: a.id,
    type: a.type || "custom",
    originalName: a.originalName || null,
    category: a.category,
    files: a.files,
    looped: a.looped ?? false,
    jukebox: a.jukebox || null,
  }));
}


function saveToLocalStorage(state: AppState) {
  try {
    const data = {
      config: state.modConfig,
      audios: state.audios,
      version: SAVE_FORMAT_VERSION,
      platform: "web",
      saved_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to auto-save to LS:", err);
  }
}

function loadFromLocalStorage(): {
  config: ModConfig;
  audios: AudioEntry[];
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.version !== SAVE_FORMAT_VERSION) return null;
    return {
      config: configFromSave(data.config),
      audios: audiosFromSave(data.audios),
    };
  } catch (err) {
    console.error("Failed to load auto-save from LS:", err);
    return null;
  }
}


type ToastState = { visible: boolean; message: string; type: ToastType };

interface TauriAPI {
  scanFolder: () => Promise<void>;
  rescanFolder: () => Promise<void>;
  watchFolder: () => Promise<void>;
  openInExplorer: (path: string) => Promise<void>;
  copyToClipboard: (text: string) => Promise<void>;
  showNotification: (msg: string) => Promise<void>;
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
  convertAudio: (
    sourcePath: string,
    targetFormat: "ogg" | "wav"
  ) => Promise<any>;
  isDesktop: boolean;
}

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  toast: ToastState;
  showToast: (message: string, type?: ToastType) => void;
  tauri: TauriAPI;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const stateRef = useRef(state);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
    type: "info",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const isDesktop = useMemo(() => detectTauri(), []);


  useEffect(() => {
    const interval = setInterval(() => {
      const currentState = stateRef.current;
      
      if (currentState.audios.length === 0 && currentState.modConfig.modId === "") {
        return;
      }

      if (isDesktop) {
        const projectData = {
          config: configToRust(currentState.modConfig),
          audios: audiosToRust(currentState.audios),
          version: SAVE_FORMAT_VERSION,
          platform: "desktop",
          saved_at: new Date().toISOString(),
        };
        
        invoke("auto_save_project", { data: projectData })
          .then(() => console.log("✅ [AutoSave] Desktop Saved"))
          .catch((err) => console.error("❌ [AutoSave] Desktop Failed:", err));
          
      } else {
        saveToLocalStorage(currentState);
        console.log("✅ [AutoSave] Web Saved");
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [isDesktop]);


  useEffect(() => {
    const initLoad = async () => {
      if (isDesktop) {
        try {
          const savedData = await invoke<any>("load_auto_save");
          if (savedData) {
            const payload = {
              config: configFromSave(savedData.config),
              audios: audiosFromSave(savedData.audios),
            };
            dispatch({ type: "LOAD_PROJECT", payload });
            setToast({ visible: true, message: "🔄 Sessão restaurada!", type: "info" });
            setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
          }
        } catch (err) {
          console.warn("⚠️ Sem auto-save desktop ou erro ao ler:", err);
        }
      } else {
        const saved = loadFromLocalStorage();
        if (saved) {
          dispatch({ type: "LOAD_PROJECT", payload: saved });
          setToast({ visible: true, message: "🔄 Sessão restaurada!", type: "info" });
          setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
        }
      }
    };

    initLoad();
  }, [isDesktop]);


  const showToast = useCallback((message: string, type: ToastType = "info") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  }, []);


  const handleFileSelect = useCallback(
    (e: Event) => {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          const payload = {
            config: configFromSave(data.config),
            audios: audiosFromSave(data.audios),
          };
          dispatch({ type: "LOAD_PROJECT", payload });
          showToast("📂 Projeto carregado!", "success");
        } catch (err) {
          showToast(`Erro: ${err}`, "error");
        }
      };
      reader.readAsText(file);
      input.value = "";
    },
    [showToast]
  );

  useEffect(() => {
    if (!isDesktop) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json,.sdvaudio";
      input.style.display = "none";
      input.addEventListener("change", handleFileSelect);
      document.body.appendChild(input);
      fileInputRef.current = input;
      return () => {
        input.removeEventListener("change", handleFileSelect);
        document.body.removeChild(input);
      };
    }
  }, [isDesktop, handleFileSelect]);


  const scanFolder = useCallback(async () => {
    if (!isDesktop) return;
    try {
      const folder = await dialogOpen({
        directory: true,
        title: "Selecionar pasta de áudios",
      });
      if (!folder || Array.isArray(folder)) return;

      dispatch({
        type: "SET_LOADING",
        payload: { loading: true, message: "🔍 Escaneando..." },
      });
      const result = await invoke("scan_audio_folder", { folderPath: folder });
      dispatch({
        type: "SET_SCAN_RESULT",
        payload: result as AppState["scanResult"],
      });
      dispatch({ type: "SET_ASSETS_FOLDER", payload: folder });
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
      showToast(
        `🔍 Encontrados ${(result as any)?.files?.length ?? 0} arquivos`,
        "success"
      );
    } catch (err) {
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
      showToast(`Erro: ${err}`, "error");
    }
  }, [showToast, isDesktop]);

  const rescanFolder = useCallback(async () => {
    if (!isDesktop) return;
    const folder = stateRef.current.assetsFolder;
    if (!folder) return;
    try {
      dispatch({
        type: "SET_LOADING",
        payload: { loading: true, message: "🔄 Atualizando..." },
      });
      const result = await invoke("scan_audio_folder", { folderPath: folder });
      dispatch({
        type: "SET_SCAN_RESULT",
        payload: result as AppState["scanResult"],
      });
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
      showToast("🔄 Atualizado!", "success");
    } catch (err) {
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
      showToast(`Erro: ${err}`, "error");
    }
  }, [showToast, isDesktop]);

  const watchFolder = useCallback(async () => {
    if (!isDesktop) return;
    const folder = stateRef.current.assetsFolder;
    if (!folder) return;
    try {
      await invoke("watch_assets_folder", { folderPath: folder });
      dispatch({ type: "SET_WATCHING", payload: true });
      showToast("👁️ Monitorando...", "success");
    } catch (err) {
      showToast(`Erro: ${err}`, "error");
    }
  }, [showToast, isDesktop]);

  const openInExplorer = useCallback(
    async (path: string) => {
      if (!isDesktop) {
        showToast("⚠️ Recurso disponível apenas na versão Desktop", "error");
        return;
      }
      try {
        await openerReveal(path);
        showToast("📁 Pasta aberta!", "success");
      } catch (err) {
        console.error("Erro ao abrir explorer:", err);
        showToast(`❌ Erro ao abrir pasta: ${err}`, "error");
      }
    },
    [showToast, isDesktop]
  );

  const copyToClipboard = useCallback(
    async (text: string) => {
      try {
        await clipboardWrite(text);
        showToast("📋 Copiado!", "success");
      } catch (err) {
        showToast(`Erro: ${err}`, "error");
      }
    },
    [showToast]
  );

  const showNotification = useCallback(
    async (msg: string) => {
      if (!isDesktop) {
        showToast(msg, "info");
        return;
      }
      try {
        await invoke("plugin:notification|show", {
          title: "Stardew Audio",
          body: msg,
        });
      } catch (err) {
        showToast(msg, "info");
      }
    },
    [showToast, isDesktop]
  );

  const showConfirm = useCallback(async (msg: string) => {
    return await dialogConfirm(msg);
  }, []);

  const saveProject = useCallback(async () => {
    const s = stateRef.current;
    const projectData = {
      config: configToRust(s.modConfig),
      audios: audiosToRust(s.audios),
      version: SAVE_FORMAT_VERSION,
      platform: isDesktop ? "desktop" : "web",
      saved_at: new Date().toISOString(),
    };
    if (isDesktop) {
      try {
        const clean = s.modConfig.modName
          .replace(/[^a-zA-Z0-9 ]/g, "")
          .trim();
        const path = await dialogSave({
          defaultPath: `${clean}.sdvaudio.json`,
          filters: [
            { name: "SDV Audio Project", extensions: ["json", "sdvaudio"] },
          ],
          title: "Salvar projeto",
        });
        if (!path) return;
        await invoke("save_project", { path, data: projectData });
        dispatch({ type: "MARK_SAVED" });
        showToast(`💾 Salvo: ${path}`, "success");
      } catch (err) {
        showToast(`Erro: ${err}`, "error");
      }
    } else {
      const dataStr = JSON.stringify(projectData, null, 2);
      const filename = `${s.modConfig.modName.replace(/[^a-zA-Z0-9]/g, "_")}.sdvaudio.json`;
      downloadStringAsFile(filename, dataStr);
      saveToLocalStorage(s);
      dispatch({ type: "MARK_SAVED" });
      showToast("💾 Projeto baixado!", "success");
    }
  }, [showToast, isDesktop]);

  const loadProject = useCallback(async () => {
    if (isDesktop) {
      try {
        const path = await dialogOpen({
          filters: [
            { name: "SDV Audio Project", extensions: ["json", "sdvaudio"] },
          ],
          title: "Abrir projeto",
        });
        if (!path || Array.isArray(path)) return;
        const data = await invoke<any>("load_project", { path });
        const payload = {
          config: configFromSave(data.config),
          audios: audiosFromSave(data.audios),
        };
        dispatch({ type: "LOAD_PROJECT", payload });
        const source =
          data.platform === "web"
            ? " (da Web)"
            : data.platform === "desktop"
              ? " (do Desktop)"
              : "";
        showToast(`📂 Projeto carregado!${source}`, "success");
      } catch (err) {
        showToast(`Erro: ${err}`, "error");
      }
    } else {
      fileInputRef.current?.click();
    }
  }, [showToast, isDesktop]);

  const exportToFolder = useCallback(
    async (copyAudio: boolean) => {
      if (!isDesktop) return;
      const s = stateRef.current;
      if (s.audios.length === 0) {
        showToast("Adicione áudios primeiro!", "error");
        return;
      }
      try {
        const folder = await dialogOpen({
          directory: true,
          title: "Pasta de exportação",
        });
        if (!folder || Array.isArray(folder)) return;
        dispatch({
          type: "SET_LOADING",
          payload: { loading: true, message: "📂 Exportando..." },
        });
        const result = await invoke<any>("export_to_folder", {
          folderPath: folder,
          config: configToRust(s.modConfig),
          audios: audiosToRust(s.audios),
          copyAudioFiles: copyAudio,
          audioSourceFolder: s.assetsFolder,
        });
        dispatch({ type: "SET_LOADING", payload: { loading: false } });
        if (result.success)
          showToast(
            `✅ ${result.files_created.length} arquivos exportados!`,
            "success"
          );
      } catch (err) {
        dispatch({ type: "SET_LOADING", payload: { loading: false } });
        showToast(`Erro: ${err}`, "error");
      }
    },
    [showToast, isDesktop]
  );

  const exportToZip = useCallback(
    async (includeAudio: boolean) => {
      if (!isDesktop) return;
      const s = stateRef.current;
      if (s.audios.length === 0) {
        showToast("Adicione áudios primeiro!", "error");
        return;
      }
      try {
        const clean = s.modConfig.modName
          .replace(/[^a-zA-Z0-9 ]/g, "")
          .trim();
        const path = await dialogSave({
          defaultPath: `[CP] ${clean}.zip`,
          filters: [{ name: "ZIP", extensions: ["zip"] }],
          title: "Salvar ZIP",
        });
        if (!path) return;
        dispatch({
          type: "SET_LOADING",
          payload: { loading: true, message: "📦 Criando ZIP..." },
        });
        const result = await invoke<any>("export_to_zip", {
          filePath: path,
          config: configToRust(s.modConfig),
          audios: audiosToRust(s.audios),
          includeAudioFiles: includeAudio,
          audioSourceFolder: s.assetsFolder,
        });
        dispatch({ type: "SET_LOADING", payload: { loading: false } });
        if (result.success) showToast("📦 ZIP criado!", "success");
      } catch (err) {
        dispatch({ type: "SET_LOADING", payload: { loading: false } });
        showToast(`Erro: ${err}`, "error");
      }
    },
    [showToast, isDesktop]
  );

  const getManifestJson = useCallback(async () => {
    const s = stateRef.current;
    if (!isDesktop)
      return JSON.stringify(buildManifest(s.modConfig), null, 4);
    try {
      return await invoke<string>("generate_manifest_json", {
        config: configToRust(s.modConfig),
      });
    } catch {
      return JSON.stringify(buildManifest(s.modConfig), null, 4);
    }
  }, [isDesktop]);

  const getContentJson = useCallback(async () => {
    const s = stateRef.current;
    if (!isDesktop)
      return JSON.stringify(buildContent(s.audios), null, 4);
    try {
      return await invoke<string>("generate_content_json", {
        audios: audiosToRust(s.audios),
      });
    } catch {
      return JSON.stringify(buildContent(s.audios), null, 4);
    }
  }, [isDesktop]);

  const getI18nJson = useCallback(async () => {
    const s = stateRef.current;
    if (!isDesktop)
      return JSON.stringify(buildI18n(s.audios), null, 4);
    try {
      return await invoke<string>("generate_i18n_json", {
        audios: audiosToRust(s.audios),
      });
    } catch {
      return JSON.stringify(buildI18n(s.audios), null, 4);
    }
  }, [isDesktop]);

  const downloadManifest = useCallback(() => {
    const s = stateRef.current;
    downloadStringAsFile(
      "manifest.json",
      JSON.stringify(buildManifest(s.modConfig), null, 4)
    );
    showToast("📜 manifest.json baixado!", "success");
  }, [showToast]);

  const downloadContent = useCallback(() => {
    const s = stateRef.current;
    if (s.audios.length === 0) {
      showToast("Adicione áudios primeiro!", "error");
      return;
    }
    downloadStringAsFile(
      "content.json",
      JSON.stringify(buildContent(s.audios), null, 4)
    );
    showToast("📄 content.json baixado!", "success");
  }, [showToast]);

  const downloadI18n = useCallback(() => {
    const s = stateRef.current;
    if (s.audios.filter((a) => a.jukebox).length === 0) {
      showToast("Sem áudio com jukebox!", "error");
      return;
    }
    downloadStringAsFile(
      "default.json",
      JSON.stringify(buildI18n(s.audios), null, 4)
    );
    showToast("🌐 default.json baixado!", "success");
  }, [showToast]);

  const downloadZip = useCallback(async () => {
    const s = stateRef.current;
    if (s.audios.length === 0) {
      showToast("Adicione áudios primeiro!", "error");
      return;
    }
    try {
      dispatch({
        type: "SET_LOADING",
        payload: { loading: true, message: "📦 Criando ZIP..." },
      });
      await generateAndDownloadZipWeb(
        s.modConfig.modName,
        buildManifest(s.modConfig),
        buildContent(s.audios),
        buildI18n(s.audios),
        []
      );
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
      showToast("📦 ZIP baixado!", "success");
    } catch (err) {
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
      showToast(`Erro: ${err}`, "error");
    }
  }, [showToast]);

  const convertAudio = useCallback(
    async (sourcePath: string, targetFormat: "ogg" | "wav") => {
      if (!isDesktop) {
        return {
          success: false,
          output_path: "",
          error: "Disponível apenas no Desktop",
        };
      }
      try {
        return await invoke<{
          success: boolean;
          output_path: string;
          error?: string;
        }>("convert_audio", { sourcePath, targetFormat });
      } catch (err) {
        return { success: false, output_path: "", error: String(err) };
      }
    },
    [isDesktop]
  );

  const tauri = useMemo<TauriAPI>(
    () => ({
      scanFolder,
      rescanFolder,
      watchFolder,
      openInExplorer,
      copyToClipboard,
      showNotification,
      showConfirm,
      saveProject,
      loadProject,
      exportToFolder,
      exportToZip,
      getManifestJson,
      getContentJson,
      getI18nJson,
      downloadManifest,
      downloadContent,
      downloadI18n,
      downloadZip,
      convertAudio,
      isDesktop,
    }),
    [
      scanFolder,
      rescanFolder,
      watchFolder,
      openInExplorer,
      copyToClipboard,
      showNotification,
      showConfirm,
      saveProject,
      loadProject,
      exportToFolder,
      exportToZip,
      getManifestJson,
      getContentJson,
      getI18nJson,
      downloadManifest,
      downloadContent,
      downloadI18n,
      downloadZip,
      convertAudio,
      isDesktop,
    ]
  );

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      )
        return;
      if (e.ctrlKey || e.metaKey) {
        const tabs: TabType[] = isDesktop
          ? ["setup", "audio", "scan", "export", "help"]
          : ["setup", "audio", "export", "help"];
        const num = parseInt(e.key);
        if (num >= 1 && num <= tabs.length) {
          e.preventDefault();
          dispatch({ type: "SET_TAB", payload: tabs[num - 1] });
        }
        if (e.key === "s") {
          e.preventDefault();
          saveProject();
        }
        if (e.key === "o") {
          e.preventDefault();
          loadProject();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [saveProject, loadProject, isDesktop]);

  const contextValue = useMemo<AppContextValue>(
    () => ({
      state,
      dispatch,
      toast,
      showToast,
      tauri,
    }),
    [state, toast, showToast, tauri]
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function useAppState() {
  return useApp().state;
}

export function useAppDispatch() {
  return useApp().dispatch;
}

export function useTauri() {
  return useApp().tauri;
}

export function useToastCtx() {
  const { toast, showToast } = useApp();
  return { toast, showToast };
}