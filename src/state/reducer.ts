import { produce } from 'immer';
import type { AppState, AppAction, ModConfig, PlayerState } from '@/types/audio';

export const defaultConfig: ModConfig = {
  modId: 'SeuNome.AudioMod',
  modName: 'Meu Mod de Áudio',
  modAuthor: 'Seu Nome',
  modVersion: '1.0.0',
  modDescription: 'Adiciona e substitui áudios do jogo',
};

export const defaultPlayer: PlayerState = {
  currentFile: null,
  isPlaying: false,
  isPaused: false,
  volume: 0.7,
  currentTime: 0,
  duration: 0,
};

export const initialState: AppState = {
  modConfig: defaultConfig,
  audios: [],
  activeTab: 'setup',
  assetsFolder: null,
  loading: false,
  loadingMessage: '',
  scanResult: null,
  watching: false,
  dirty: false,
  player: defaultPlayer,
  convertJobs: [],
  selectedScanFiles: [],
};

export function appReducer(state: AppState, action: AppAction): AppState {
  return produce(state, (draft) => {
    switch (action.type) {
      case 'SET_CONFIG':
        Object.assign(draft.modConfig, action.payload);
        draft.dirty = true;
        break;

      case 'SET_CONFIG_FULL':
        draft.modConfig = action.payload;
        draft.dirty = true;
        break;

      case 'ADD_AUDIO':
        draft.audios.push(action.payload);
        draft.dirty = true;
        break;

      case 'REMOVE_AUDIO':
        draft.audios.splice(action.payload, 1);
        draft.dirty = true;
        break;

      case 'UPDATE_AUDIO':
        draft.audios[action.payload.index] = action.payload.audio;
        draft.dirty = true;
        break;

      case 'REORDER_AUDIO': {
        const { from, to } = action.payload;
        const [item] = draft.audios.splice(from, 1);
        draft.audios.splice(to, 0, item);
        draft.dirty = true;
        break;
      }

      case 'CLEAR_AUDIOS':
        draft.audios = [];
        draft.dirty = true;
        break;

      case 'SET_TAB':
        draft.activeTab = action.payload;
        break;

      case 'SET_ASSETS_FOLDER':
        draft.assetsFolder = action.payload;
        break;

      case 'SET_LOADING':
        draft.loading = action.payload.loading;
        draft.loadingMessage = action.payload.message || '';
        break;

      case 'SET_SCAN_RESULT':
        draft.scanResult = action.payload;
        draft.selectedScanFiles = [];
        break;

      case 'SET_WATCHING':
        draft.watching = action.payload;
        break;

      case 'LOAD_PROJECT':
        draft.modConfig = action.payload.config;
        draft.audios = action.payload.audios;
        draft.dirty = false;
        break;

      case 'RESET':
        Object.assign(draft, initialState);
        break;

      case 'MARK_SAVED':
        draft.dirty = false;
        break;

      case 'SET_PLAYER':
        Object.assign(draft.player, action.payload);
        break;

      case 'ADD_CONVERT_JOB':
        draft.convertJobs.push(action.payload);
        break;

      case 'UPDATE_CONVERT_JOB': {
        const job = draft.convertJobs.find(j => j.id === action.payload.id);
        if (job) Object.assign(job, action.payload.updates);
        break;
      }

      case 'REMOVE_CONVERT_JOB':
        draft.convertJobs = draft.convertJobs.filter(j => j.id !== action.payload);
        break;

      case 'CLEAR_CONVERT_JOBS':
        draft.convertJobs = [];
        break;

      case 'TOGGLE_SCAN_FILE': {
        const idx = draft.selectedScanFiles.indexOf(action.payload);
        if (idx === -1) {
          draft.selectedScanFiles.push(action.payload);
        } else {
          draft.selectedScanFiles.splice(idx, 1);
        }
        break;
      }

      case 'SELECT_ALL_SCAN_FILES':
        if (draft.scanResult) {
          draft.selectedScanFiles = draft.scanResult.files
            .filter(f => {
              const ext = f.name.split('.').pop()?.toUpperCase() || '';
              const isOgg = ext === 'OGG';
              return (isOgg && f.is_vorbis) || !isOgg;
            })
            .map(f => f.name);
        }
        break;

      case 'DESELECT_ALL_SCAN_FILES':
        draft.selectedScanFiles = [];
        break;
    }
  });
}
